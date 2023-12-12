const proxyTarget = {};
const referencesEl = document.getElementById('references');
const refs = new Proxy(proxyTarget, {
  set (target, key, value) {
    target[key] = value;
    startReferences(referencesEl);
    return true;
  },
  deleteProperty (target, key) {
    delete target[key];
    startReferences(referencesEl);
    return true;
  }
});
const nameFromPath = (path) => path.split('/').pop();
const rootName = nameFromPath(location.pathname);
const rootFiles = document.getElementById('rootFiles');
const mainTabContent = document.getElementById('mainTabContent');
const originalHTML = document.children[0].outerHTML;
const html5DOCTYPE = "<!DOCTYPE html>\n";
const rootHTML = html5DOCTYPE+originalHTML;
const log = function () {
  const formatedArgs = [];
  for (arg in arguments) {
    const argument = arguments[arg];
    formatedArgs.push(formatOutput(argument));
  }
  const p = document.createElement('p');
  p.textContent = formatedArgs.join('\n');
  document.getElementById('log').prepend(p);
  console.log.apply(console, arguments);
};
const startCode = async () => {
  await importJS('lib/zip/jszip.js');
  await importCSS('src/tabs/tabs.css');
  await addRootFiles(); // HTML CSS and JS to pre rootFiles
  refs.zip = await zipRootFiles(); // pre rootFiles to zip
  await importJS('lib/editor/ace.js');
  refs.buildDom = ace.require('ace/lib/dom').buildDom;
  await importJS('src/toolbar/toolbar.js');
  await importCSS('src/toolbar/toolbar.css');
  refs.toolBar = new ToolBar()
  refs.toolBar.topBar(mainTabContent);
  await importJS('src/fileTree/fileTree.js');
  refs.fileTree = new FileTree(refs.zip); // zip to fileTree
  await importCSS('src/fileTree/fileTree.css');
  refs.fileTree.el = await refs.fileTree.start(mainTabContent);
  await importJS('src/editor/editor.js');
  await importCSS('src/editor/editor.css');
  refs.editor = await new Editor();
  refs.editor.aceEditor = await refs.editor.start(mainTabContent); // tabs and editBar
  startReferences(referencesEl);
  document.getElementById('cmdInput').addEventListener('keydown', cmdKeydown);
  log('code started');
  /*
  todo
  methods list on right
  */
};
const importCSS = async (path) => {
  const data = await getFileData(path, rootFiles);
  const style = document.createElement('style');
  style.textContent = data;
  style.dataset.path = path;
  return document.head.appendChild(style);
};
const importJS =  async (path) => {
  const data = await getFileData(path, rootFiles);
  const script = document.createElement('script');
  script.textContent = data;
  script.dataset.path = path;
  document.body.appendChild(script);
}; 
const getByPath = (path, doc = document, q = '') => {
  return doc.querySelector(q+'[data-path="'+path+'"]');
};
const addRootFiles = async () => {
  const js = 'in2D.js';
  const css = 'in2D.css';
  await addRootFile(js, getFileData(js));
  await addRootFile(css, getFileData(css));
  await addRootFile(rootName, rootHTML);
  return true;
};
const addRootFile = async (path, content) => {
  const data = await zipFile(path, content);
  const pre = preRootFile(path, data, 'zip');
  pre.dataset.root = true
  rootFiles.prepend(pre);
};
const preRootFile = (path, data, ext, doc = document) => {
  const file = doc.createElement('pre');
  file.className = ext;
  file.dataset.path = path;
  file.textContent = data;
  return file;
};
const zipRootFiles = async () => {
  const zip = new JSZip();
  for (let pre of rootFiles.querySelectorAll('pre')) {
    await zipRootFile(zip, pre.dataset.path);
  }
  return zip;
};
const zipRootFile = async (zip, path) => {
  let data = await getFileData(path, rootFiles);
  return zip.file(path, data, zipCompressOptions);
};
const zipCompressOptions = { 
  compression: 'DEFLATE', 
  compressionOptions: {level: 9}
};
const zipFile = async (path, data) => {
  var zipHandler = new JSZip();
  zipHandler.file(path, data, zipCompressOptions);
  return await zipHandler.generateAsync({type: 'base64'});
};
const unzipFile = async (path, compressedData) => {
  var zipHandler = new JSZip();
  await zipHandler.loadAsync(atob(compressedData));
  return await zipHandler.file(path).async('text');
};
const getFileData = async (path, doc = document) => {
  const el = getByPath(path, doc);
  if (el.className == 'b64') return decodeURI(atob(el.textContent));
  if (el.className == 'zip') return await unzipFile(nameFromPath(path), el.textContent);
  else {
    if (el.textContent.at(0) == '\n') return el.textContent.replace('\n', '');
    else return el.textContent;
  }
};
const setFileData = async (path, text, doc = document) => {
  const el = getByPath(path, doc);
  if (el.className == 'b64') el.textContent = btoa(encodeURI(text));
  else if (el.className == 'zip') el.textContent = await zipFile(nameFromPath(path), text);
  else el.textContent = text;
  return el;
};
const formatOutput = (val, ref) => {
  const type = typeof(val);
  let str = String(val);
  if (val !== null && type == 'object') {
    str = val.constructor.name;
    if (val instanceof JSZip) str = 'JSZip';
  }
  if (type == 'function') {
    console.log(ref, val.name)
    let name = (ref == val.name) ? '' : ' '+val.name;
    str = 'function'+name+'('+str.split('\n')[0].split('(')[1].split(')')[0]+')';
  }
  if (type == 'string') str = '"'+str+'"';
  return str;
};
const startReferences = (parent) => {
  parent.textContent = '';
  const refsItems = [];
  for (let ref in refs) refsItems.push(ref);
  refsItems.sort();
  const ul = document.createElement('ul');
  ul.className = 'refs';
  for (let ref of refsItems) {
    const val = refs[ref];
    const str = ref + ': '+ formatOutput(val, ref);
    const li = document.createElement('li');
    li.className = 'ref';
    li.textContent = str;
    ul.appendChild(li)
  }
  parent.appendChild(ul);
};
const cmdKeydown = (event) => {
  let err = false, func, res;
  if (event.key == 'Enter') {
    try { func = new Function('return '+event.target.value) }
    catch (declareError) { 
      log(declareError);
      err = true;
    }
    if (!err) {
      try { res = func() }
      catch (runError) {
        log(runError);
        err = true;
      }
    }
    if (!err) {
      log(res);
      event.target.value = '';
    }
  }
};

startCode();

