const ToolBar = function () {
  const topBar = (parent) => {  
    const toolBar = refs.buildDom(['div', { class: 'toolBar'},
      ['button', { onclick: newFile }, 'new'],
      ['button', { onclick: openFile }, 'open'],
      ['button', { onclick: importLink }, 'import'],
      ['button', { ref: 'undoFile', disabled: true }, 'undo'],
      ['button', { ref: 'redoFile', disabled: true }, 'redo'],
      ['input', { ref: 'fileInput', type: 'file', onchange: changeFile, class: 'hidden'}],
      ['button', { onclick: saveFile }, 'save'],
      ['a', { ref: 'link', class: 'hidden' }],
      ['button', { onclick: zipSession }, 'zip'],
      ['button', { onclick: runSession }, 'run']
    ], parent, refs.toolBar);
    /*todo
    undo redo
    bundle (export all files and refs to clear pre root files)
    */
    return toolBar;
  };
  this.topBar = topBar;
  const zipAndOpenFile = async (name, path, text) => {
    refs.fileTree.addPath(path);
    refs.editor.newSession(path, text);
    const data = await zipFile(name, text);
    const pre = preRootFile(path, data, 'zip');
    rootFiles.appendChild(pre);
    const oldHTML = refs.editor.sessions[rootName].getValue();
    const parser = new DOMParser();
    const virtualDoc = parser.parseFromString(oldHTML, 'text/html');
    const newPre = preRootFile(path, data, 'zip', virtualDoc);
    virtualDoc.getElementById('rootFiles').appendChild(newPre);
    const newHTML = virtualDoc.children[0].outerHTML;
    refs.editor.sessions[rootName].setValue(newHTML);
    setFileData(rootName, newHTML, rootFiles);
    return data;
  };
  const newFile = async () => {
    const name = 'newFile.txt';
    let folder = refs.fileTree.getCurrentPath();
    if (folder.length) folder = folder + '/';
    const path = folder + name;
    const text = '';
    await refs.zip.file(path, text, zipCompressOptions);
    zipAndOpenFile(name, path, text);
  };
  const openFile = () => { refs.toolBar.fileInput.click(); };
  const changeFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      const name = file.name;
      const reader = new FileReader();
      reader.addEventListener('load', async (event) => {
        let folder = refs.fileTree.getCurrentPath();
        if (folder.length) folder = folder + '/';
        const path = folder + name;
        await refs.zip.file(path, event.target.result, zipCompressOptions);
        const text = await refs.zip.file(path).async('text');
        zipAndOpenFile(name, path, text);
      });
      reader.readAsArrayBuffer(file);
    }
  };
  const importLink = async () => {
    let link = prompt('URL', 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js');
    if (link) {
      const name = link.split('/').pop();
      const data = await fetch(link);
      let folder = refs.fileTree.getCurrentPath();
      if (folder.length) folder = folder + '/';
      const path = folder + name;
      await refs.zip.file(path, data.arrayBuffer(), zipCompressOptions);
      const text = await refs.zip.file(path).async('text');
      zipAndOpenFile(name, path, text);
    }
  };
  const saveFile = () => {
    const name = refs.fileTree.el.querySelector('.active .itemName').textContent;
    refs.toolBar.link.download = name;
    const file = new File([refs.editor.aceEditor.session.getValue()], name, {type: 'text/plain'});
    refs.toolBar.link.href = URL.createObjectURL(file);
    refs.toolBar.link.click();
    refs.toolBar.updateEditBar();
  };
  this.saveFile = saveFile;
  const zipSession = async () => {
    const activeFile = refs.fileTree.el.querySelector('.active');
    const name = activeFile.querySelector('.itemName').textContent;
    refs.toolBar.link.download = name+'.zip';
    var zipHandler;
    if (activeFile.parentElement == refs.fileTree.rootList.firstElementChild) {
      zipHandler = refs.zip
    } else {
      zipHandler = new JSZip();
      await zipHandler.file(name, refs.editor.aceEditor.session.getValue(), zipCompressOptions);
    }
    const content = await zipHandler.generateAsync({type:"blob"});
    const file = new File([content], name+'.zip', {type: 'application/zip'});
    refs.toolBar.link.href = URL.createObjectURL(file);
    refs.toolBar.link.click();
  };
  const runSession = () => {
    const newWindow = window.open();
    newWindow.document.write(refs.editor.aceEditor.session.getValue());
  };
  /* edit bar */
  const editBar = (parent) => {
    const toolBar = refs.buildDom(['div', { class: 'editBar'},
      ['button', { ref: 'undoEdit', onclick: () => refs.editor.aceEditor.undo() }, 'undo'],
      ['button', { ref: 'redoEdit', onclick: () => refs.editor.aceEditor.redo() }, 'redo'],
      ['button', { style: 'font-weight: bold', onclick: boldText }, 'bold'], 
      ['button', { style: 'font-style: italic', onclick: italicText }, 'italic']
    ], parent, refs.toolBar);
    /*todo
    content mode reactive buttons
    */
    return toolBar;
  };
  this.editBar = editBar;
  const updateEditBar = () => {
    const session = refs.editor.aceEditor.session;
    refs.toolBar.undoEdit.disabled = !(session?.getUndoManager().hasUndo());
    refs.toolBar.redoEdit.disabled = !(session?.getUndoManager().hasRedo());
  };
  this.updateEditBar = updateEditBar;
  const boldText = () => {
    refs.editor.aceEditor.session.insertSnippet('<b>${1:$SELECTION}</b>');
    refs.editor.aceEditor.session.renderer.scrollCursorIntoView();
  };
  const italicText = () => {
    refs.editor.aceEditor.session.insertSnippet('<i>${1:$SELECTION}</i>');
    refs.editor.aceEditor.session.renderer.scrollCursorIntoView();
  };
};
