const Editor = function () {
  this.sessions = {};
  const start = (path, text) => {
    window.addEventListener('beforeunload', confirmQuit);
    refs.editorContainer = refs.buildDom(['session', {class: 'editorContainer'}], refs.mainTabContent);
    refs.editorTabs = refs.buildDom(startEditorTabs(), refs.editorContainer);
    refs.editorSession = refs.buildDom(['session', {class: 'editorSession'}], refs.editorContainer);
    const session = newSession(path, text);
    return session;
  };
  this.start = start;
  const confirmQuit = (event) => {
    event.preventDefault();
    return event.returnValue = "Are you sure you want to exit? Changes you made may not be saved";
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
    const editorTabs = ['div', { class: 'editorTabs tabs' }]; 
    return editorTabs;
  };
  const newSession = async (path, text) => {
    if (!refs.editor.sessions[path]) {
      const editor = refs.buildDom(['pre', { class: 'editor', contentEditable: true } ], refs.editorSession);
      editor.addEventListener('input', updateEditor);
      editor.textContent = text;
      refs.editorTabs.querySelector('.active')?.classList.remove('active');
      const tab = refs.buildDom(newEditorTab(path));
      refs.editorTabs.appendChild(tab);
      refs.editor.sessions[path] = {editor, tab, path, text};
    } else switchSession(path);
  };
  this.newSession = newSession;
  const switchSession = (path) => {
    refs.editorTabs.querySelector('.active').classList.remove('active');
    //setSession(refs.editor.sessions[path]);
    console.log('setSession');
    const tab = getByPath(path, refs.editorTabs);
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
      if (path !== refs.rootName) {
        let text = refs.editor.innerHTML;
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
  };
};
