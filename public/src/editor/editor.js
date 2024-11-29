const Editor = function () {
  this.sessions = {};
  const start = async (parent) => {
    const editor = refs.buildDom(['div', { class: 'editor', contentEditable: true } ], refs.mainTabContent);
    // events
    editor.on('input', updateEditor);
    window.addEventListener('beforeunload', confirmQuit);
    editor.commands.addCommand(saveCommand);
    const editorContainer = refs.buildDom(['session', {class: 'editorContainer'}], parent);
    refs.editor.tabs = refs.buildDom(startEditorTabs(), editorContainer, refs);
    const editBar = refs.toolBar.editBar(editorContainer);
    editorContainer.appendChild(editor.container);
    refs.editor.sessions[refs.rootName] = refs.rootHTML;
    /*
    todo
    emmet html auto complete https://ace.c9.io/build/demo/emmet.html
    editor options https://ace.c9.io/build/demo/settings_menu.html
    shortcuts https://github.com/ajaxorg/ace/wiki/Default-Keyboard-Shortcuts
    https://ace.c9.io/build/kitchen-sink.html
    offline worker validation https://github.com/ajaxorg/ace/wiki/Syntax-validation
    */
    return editor;
  };
  this.start = start;
  const confirmQuit = (event) => {
    event.preventDefault();
    return event.returnValue = "Are you sure you want to exit? Changes you made may not be saved";
  };
  const saveCommand = {
    name: 'save',
    exec: refs.toolBar.saveFile,
    bindKey: { win: 'ctrl-s', mac: 'cmd-s' }
  };
  const openFileTab = (event) => {
    const tab = event.target.closest('.tab');
    if (!tab.classList.contains('active')) {
      const path = tab.dataset.path;
      switchSession(path);
    }
  };
  const newEditorTab = (path) => {
    const name = refs.nameFromPath(path);
    const xChar = decodeURI('%C3%97');
    const closeBt = ['span', { class: 'closeIcon round'/*, onclick: closeFileTab*/  }, xChar];
    const nameSpan = ['span', { class: 'name' }, name];
    return ['span', { class: 'tab active', 'data-path': path, onclick: openFileTab  }, [nameSpan, closeBt]];
  };
  const startEditorTabs = () => {
    const editorTabs = ['div', { class: 'editorTabs tabs' }, 
       newEditorTab(rootName)
    ]; 
    return editorTabs;
  };
  const newSession = async (path, text) => {
    if (!refs.editor.sessions[path]) {
      const modeList = ace.require("ace/ext/modelist");
      const autoMode = modeList.getModeForPath(path).mode;
      const newSession = ace.createEditSession(text);
      newSession.setUseSoftTabs(true);
      newSession.setTabSize(2);
      newSession.setOptions(editorSessionOptions);
      newSession.setOptions({ mode: autoMode });
      refs.editor.innerHTML = text;
      refs.editor.sessions[path] = newSession;
      refs.editor.tabs.querySelector('.active').classList.remove('active');
      const newTab = refs.buildDom(newEditorTab(path));
      refs.editor.tabs.appendChild(newTab);
      refs.toolBar.updateEditBar();
    } else switchSession(path);
  };
  this.newSession = newSession;
  const switchSession = (path) => {
    refs.editor.tabs.querySelector('.active').classList.remove('active');
    refs.editor.aceEditor.setSession(refs.editor.sessions[path]);
    const tab = getByPath(path, refs.editor.tabs);
    tab.classList.add('active');
    refs.fileTree.el.querySelector('.active').classList.remove('active');
    const item = getByPath(path, refs.fileTree.el);
    item.classList.add('active');
    refs.toolBar.updateEditBar();
  };
  this.switchSession = switchSession;
  const updateEditor = async () => {
    const row = refs.fileTree.el.querySelector('.active');
    if (row.parentElement.classList.contains('file')) {
      const path = row.dataset.path;
      if (path !== rootName) {
        let text = refs.editor.aceEditor.session.getValue();
        const isRoot = (path == 'in2D.js' || path == 'in2D.css');
        if (isRoot) text = '\n' + text;
        refs.zip.file(path, text, zipCompressOptions);
        await setFileData(path, text, rootFiles);
        const oldHTML = refs.editor.sessions[refs.rootName].getValue();
        const parser = new DOMParser();
        const virtualDoc = parser.parseFromString(oldHTML, 'text/html');
        if (isRoot) {
          const el = getByPath(path, virtualDoc);
          el.textContent = text;
        } else {
          const virtualFiles = virtualDoc.getElementById('rootFiles');
          await setFileData(path, text, virtualFiles);
        }
        const newHTML = virtualDoc.children[0].outerHTML;
        refs.editor.sessions[refs.rootName].setValue(newHTML);
      }
    }
    refs.toolBar.updateEditBar();
  };
};
