const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

const repo = path.resolve(__dirname, '..');
const root = path.join(repo, 'miniprogram');

function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (['node_modules', '.git'].includes(entry.name)) return [];
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? files(filename) : [filename];
  });
}

function json(filename) {
  return JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
}

function moduleId(filename) {
  return path.relative(root, filename).split(path.sep).join('/');
}

function main() {
  const compiler = process.argv[2] ? path.resolve(process.argv[2]) :
    path.dirname(require.resolve('miniprogram-compiler'));
  const platform = { win32: 'windows', darwin: 'mac', linux: 'linux' }[process.platform];
  if (!platform) throw new Error(`Unsupported compiler platform: ${process.platform}`);

  function compile(name, args, label) {
    const binary = path.join(compiler, 'bin', platform, name + (process.platform === 'win32' ? '.exe' : ''));
    if (process.platform !== 'win32') fs.chmodSync(binary, fs.statSync(binary).mode | 0o100);
    const result = spawnSync(binary, args, {
      cwd: root, encoding: 'utf8', timeout: 60000, maxBuffer: 64 * 1024 * 1024,
    });
    if (result.error) throw result.error;
    if (result.status !== 0 || !result.stdout.trim()) {
      throw new Error(`${label} failed (${result.status}): ${(result.stderr || result.stdout).slice(-6000)}`);
    }
    console.log(`PASS: ${label}`);
    return result.stdout;
  }

  const sourceFiles = files(root);
  const templates = sourceFiles.filter(file => file.endsWith('.wxml'));
  const scripts = sourceFiles.filter(file => file.endsWith('.wxs'));
  const styles = sourceFiles.filter(file => file.endsWith('.wxss'));
  const globalAliases = Object.keys(json(path.join(root, 'app.json')).usingComponents || {});
  const componentArgs = [templates.length];
  for (const file of templates) {
    const config = file.slice(0, -5) + '.json';
    const aliases = new Set(globalAliases);
    if (fs.existsSync(config)) Object.keys(json(config).usingComponents || {}).forEach(alias => aliases.add(alias));
    componentArgs.push(moduleId(file), aliases.size, ...aliases);
  }
  const wxml = compile('wcc', [
    '-d', '-cc', componentArgs.join(' '), ...templates.map(moduleId),
    ...scripts.map(moduleId), '-gn', '$gwx',
  ], `${templates.length} WXML templates and ${scripts.length} WXS modules`);
  new vm.Script(wxml, { filename: 'compiled-wxml.js' });

  const componentStyles = [], otherStyles = [];
  for (const file of styles) {
    const config = file.slice(0, -5) + '.json';
    (fs.existsSync(config) && json(config).component === true ? componentStyles : otherStyles).push(file);
  }
  compile('wcsc', [
    '-db', '-pc', String(componentStyles.length),
    ...componentStyles.concat(otherStyles).map(moduleId),
  ], `${styles.length} WXSS stylesheets`);

  const javascript = sourceFiles.concat(files(path.join(repo, 'cloudfunctions')))
    .filter(file => file.endsWith('.js'));
  for (const file of javascript) {
    const result = spawnSync(process.execPath, ['--check', file], {
      cwd: repo, encoding: 'utf8', timeout: 10000,
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`${path.relative(repo, file)}: ${result.stderr}`);
  }
  console.log(`PASS: ${javascript.length} application and cloud-function JavaScript files`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
