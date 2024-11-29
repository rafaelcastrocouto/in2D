const FileTree = function (zip) {
  const menuIconChar = '\u22ee';
  const downArrowChar = '\u25be';
  const rightArrowChar = '\u25b8';
  const start = (container) => {
    const el = refs.buildDom(['div', { class: 'fileTree'}], container);
    const rootList = refs.buildDom(['ul', { ref: 'rootList' }], el, refs.fileTree);
    zip.forEach((path) => {
      const dirPath = path.endsWith('/') ? path.slice(0, -1) : path;
      if (zip.files[path].dir) {
        item = createFolder(dirPath);
        item.appendChild(folderList(dirPath));
      } else {
        item = createFile(path);
      }
      const parentPath = dirPath.split('/').slice(0, -1).join('/');
      const parentList = getByPath(parentPath, el, 'ul.folder');
      const parent = parentList ? parentList : rootList;
      parent.appendChild(item);
      if (getByPath(path, rootFiles)?.dataset.root) 
        item.querySelector('.itemName').dataset.root = true;
      else item.querySelector('.itemName').addEventListener('blur', renameItem);
    });
    el.querySelector('.row').classList.add('active');
    return el;
    /* 
    todo
    favorites
    search file text input
    file ext and folder custom icons
    select mode (multi rename and delete)
    rename and delete file confirm dialog
    cut copy paste duplicate
    drag and drop
    */
  };
  const getCurrentPath = () => {
    const active = this.el.querySelector('.active');
    let path = active.dataset.path;
    if (active.parentElement.classList.contains('file')) 
      path = path.split('/').slice(0, -1).join('/');
    return path;
  };
  const addPath = (path) => {
    const folder = this.getCurrentPath();
    this.el.querySelector('.active').classList.remove('active');
    const fileItem = createFile(path, 'active');
    if (folder == '') refs.fileTree.rootList.appendChild(fileItem);
    else getByPath(folder, this.el, 'ul.folder').appendChild(fileItem);
    fileItem.querySelector('.itemName').addEventListener('blur', renameItem);
  };
  const createFile = (path, active) => {
    const name = refs.nameFromPath(path);
    const fileName = ['span', { class: 'itemName', onclick: openItem }, name];
    const menuIcon = ['span', { class: 'menuIcon round', /*onclick: showFileMenu*/ }, menuIconChar];
    const row = ['p', { class: ['row', active].join(' '), 'data-path': path }, [fileName, menuIcon]];
    return refs.buildDom(['li', { class: 'file' }, row]);
  };
  const createFolder = (path, active) => {
    const name = refs.nameFromPath(path);
    const folderIcon = ['span', { class: 'folderIcon round', onclick: toggleFolder }, downArrowChar];
    const folderName = ['span', { class: 'itemName', onclick: focusFolder }, name];
    const menuIcon = ['span', { class: 'menuIcon round', /*onclick: showFileMenu*/ }, menuIconChar];
    const row = ['p', { class: ['row', active].join(' '), 'data-path': path }, [folderIcon, folderName, menuIcon]];
    return refs.buildDom(['li', { class: 'folder' }, row ]);
  };
  /*
  fileMenu
  - rename
  - duplicate
  - copy file
  - copy fileName
  - copy filePath
  - copy fileContent
  - select
  - delete  
  */
  const folderList = (path) => {
    let h = '';
    if (path.split('/').length > 1) h = ' hidden';
    return refs.buildDom(['ul', { class: 'folder'+h, 'data-path': path }]);
  };
  const validateName = (name) => {
    return /^[^\\/:\*\?\n\t\r"<>\|]+$/.test(name);
  };
  const renameItem = async (event) => {
    const oldPath = event.target.parentElement.dataset.path;
    const newName = event.target.textContent;
    const newPath = [...oldPath.split('/').slice(0,-1), newName].join('/');
    const dirPath = oldPath.endsWith('/') ? oldPath : oldPath + '/';
    if (validateName(newName)) {
      if (zip.files[dirPath]?.dir) {
        renameFolder(oldPath, newPath, newName);
      } else {
        renameFile(oldPath, newPath, newName);
      }
    } else {
      const oldName = oldPath.split('/').pop();
      event.target.textContent = oldName;
    }
  };
  const renameFolder = async (oldPath, newPath, newName) => {
    await zip.folder(oldPath+'/').forEach(async (subPath) => {
      if (!zip.files[oldPath+'/'+subPath].dir) {
        await renameFile(oldPath+'/'+subPath, newPath+'/'+subPath, newName);
      }
    });
    zip.remove(oldPath);
  };
  const renameFile = async (oldPath, newPath, newName) => {
    console.log(oldPath, newPath)
    // update filetree path
    getByPath(oldPath, this.el).dataset.path = newPath;
    // update rootFiles
    const oldPre = getByPath(oldPath, rootFiles);
    const oldData = await getFileData(oldPath, rootFiles);
    const ext = oldPre.className;
    const data = await zipFile(refs.nameFromPath(newPath), oldData);
    const newPre = preRootFile(newPath, data, ext);
    getByPath(oldPath, rootFiles).remove();
    rootFiles.appendChild(newPre);
    // update tab
    const tab = getByPath(oldPath, refs.editor.tabs);
    tab.dataset.path = newPath;
    tab.querySelector('.name').textContent = newName;
    // update zip
    zip.remove(oldPath);
    zip.file(newPath, data, zipCompressOptions);
    // update root session
    const oldHTML = refs.editor.sessions[refs.rootName].getValue();
    const parser = new DOMParser();
    const virtualDoc = parser.parseFromString(oldHTML, 'text/html');
    const virtualPre = preRootFile(newPath, data, 'zip', virtualDoc);
    const virtualFiles = virtualDoc.getElementById('rootFiles');
    getByPath(oldPath, virtualFiles).remove();
    virtualFiles.appendChild(virtualPre);
    const newHTML = virtualDoc.children[0].outerHTML;
    refs.editor.sessions[refs.rootName].setValue(newHTML);
    // update item session
    refs.editor.sessions[newPath] = refs.editor.sessions[oldPath];
    delete refs.editor.sessions[oldPath];
    return true;
  };
  const focusFolder = (event) => {
    const row = event.target.parentElement;
    if (!row.classList.contains('active')) {
      const last = this.el.querySelector('.active');
      last.classList.remove('active');
      last.querySelector('.itemName').contentEditable = false;
      const folderItem = event.target.closest('li.folder');
      const row = folderItem.querySelector('.row');
      row.classList.add('active');
    }
    if (!event.target.dataset.root) event.target.contentEditable = true;
  };
  const toggleFolder = (event) => {
    const folderItem = event.target.closest('li.folder');
    const folderList = folderItem.querySelector('ul.folder');
    folderList.classList.toggle('hidden');
    folderItem.querySelector('.menuIcon').classList.toggle('closed');
    focusFolder({target: folderItem.querySelector('.itemName')});
    if (event.target.textContent == downArrowChar) event.target.textContent =  rightArrowChar;
    else event.target.textContent = downArrowChar;
  };
  const openItem = async (event) => {
    const row = event.target.parentElement;
    if (!row.classList.contains('active')) {
      const last = this.el.querySelector('.active');
      last.classList.remove('active');
      last.querySelector('.itemName').contentEditable = false;
      row.classList.add('active');
      var path = row.dataset.path;
      if (refs.editor.sessions[path]) refs.editor.switchSession(path);
      else {
        const content = await getFileData(path, rootFiles);
        refs.editor.newSession(path, content);
      }
    }
    const name = row.querySelector('.itemName');
    if (!name.dataset.root) name.contentEditable = true;
    /* 
    todo
    update zip file while editing 
    multiple sessions
    */
  };
  this.importCSS = importCSS;
  this.start = start;
  this.addPath = addPath;
  this.getCurrentPath = getCurrentPath;
};