const Editor = function () {
  this.sessions = {};
  this.darkModeLoaded = false;
  const start = async (parent) => {
    // online path
    ace.config.set('basePath', 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.9.5/');
    const aceEditor = ace.edit();
    // events
    aceEditor.on('input', updateEditor);
    window.addEventListener('beforeunload', confirmQuit);
    aceEditor.commands.addCommand(saveCommand);
    // dark mode
    const darkModeScheme = matchMedia('(prefers-color-scheme: dark)');
    await editorLoadDarkMode(darkModeScheme);
    editorModeChange.call(this, darkModeScheme, aceEditor);
    darkModeScheme.addEventListener('change', editorModeChange.bind(this, darkModeScheme, aceEditor));
    // dom
    const editorContainer = refs.buildDom(['session', {class: 'editorContainer'}], parent);
    refs.editor.tabs = refs.buildDom(startEditorTabs(), editorContainer, refs);
    const editBar = refs.toolBar.editBar(editorContainer);
    editorContainer.appendChild(aceEditor.container);
    // resize
    let observer = new ResizeObserver( aceEditor.resize.bind(aceEditor) );
    observer.observe(editorContainer, { attributes: true });
    // extensions
    await importJS('lib/editor/ext-language_tools.js');
    ace.require("ace/ext/language_tools");
    // mode
    await importJS('lib/editor/ext-modelist.min.js');
    ace.require("ace/ext/modelist");
    await importJS('lib/editor/mode-html.js');
    aceEditor.session.setOptions({ mode: 'ace/mode/html' });
    // options
    aceEditor.setOptions(editorSessionOptions);
    aceEditor.session.setUseSoftTabs(true);
    aceEditor.session.setTabSize(2);
    // value 
    aceEditor.session.setValue(rootHTML);
    refs.editor.sessions[rootName] = aceEditor.session;
    /*
    todo
    emmet html auto complete https://ace.c9.io/build/demo/emmet.html
    editor options https://ace.c9.io/build/demo/settings_menu.html
    shortcuts https://github.com/ajaxorg/ace/wiki/Default-Keyboard-Shortcuts
    https://ace.c9.io/build/kitchen-sink.html
    offline worker validation https://github.com/ajaxorg/ace/wiki/Syntax-validation
    */
    return aceEditor;
  };
  this.start = start;
  const confirmQuit = (event) => {
    if (!refs.editor.aceEditor.session.getUndoManager().isClean()) {
      event.preventDefault();
      return event.returnValue = "Are you sure you want to exit? Changes you made may not be saved";
    }
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
    const name = nameFromPath(path);
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
  const editorSessionOptions = {
    enableSnippets: false,
    enableLiveAutocompletion: true,
    useWorker: false
  };
  const editorLoadDarkMode = async (event) => {
    if (event.matches && !refs.editor.darkModeLoaded) {
      await importJS('lib/editor/theme-twilight.js');
      refs.editor.darkModeLoaded = true;
    }
    return event.matches;
  };
  const editorModeChange = (event, editor) => {
    if (event.matches) editor.setOptions({ theme: 'ace/theme/twilight' });
    else editor.setOptions({ theme: 'ace/theme/textmate' });
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
      refs.editor.aceEditor.setSession(newSession);
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
        const oldHTML = refs.editor.sessions[rootName].getValue();
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
        refs.editor.sessions[rootName].setValue(newHTML);
      }
    }
    refs.toolBar.updateEditBar();
  };
};
