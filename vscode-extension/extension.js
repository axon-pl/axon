'use strict';

const vscode = require('vscode');

const SYNTH_LANGUAGE_ID = 'synth';

function isSynDocument(doc) {
  if (!doc) return false;
  const filePath = (doc.uri.fsPath || doc.fileName || '').toLowerCase();
  if (filePath.endsWith('.syn')) return true;
  // Untitled buffers named *.syn
  if (doc.uri.scheme === 'untitled' && (doc.fileName || '').toLowerCase().endsWith('.syn')) {
    return true;
  }
  return false;
}

/** Force .syn files onto the synth language id so TextMate grammar loads. */
async function ensureSynthLanguage(doc) {
  if (!isSynDocument(doc)) return;
  if (doc.languageId === SYNTH_LANGUAGE_ID) return;
  try {
    await vscode.languages.setTextDocumentLanguage(doc, SYNTH_LANGUAGE_ID);
  } catch {
    // Ignore races when the document closes while we rebind language.
  }
}

async function rebindAllOpenSynFiles() {
  for (const doc of vscode.workspace.textDocuments) {
    await ensureSynthLanguage(doc);
  }
  const editor = vscode.window.activeTextEditor;
  if (editor) await ensureSynthLanguage(editor.document);
}

function activate(context) {
  void rebindAllOpenSynFiles();

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      void ensureSynthLanguage(doc);
    }),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) void ensureSynthLanguage(editor.document);
    }),
    vscode.commands.registerCommand('synth.rebindLanguage', async () => {
      await rebindAllOpenSynFiles();
      void vscode.window.showInformationMessage('Synth language mode reapplied to open .syn files.');
    })
  );

  // Late pass — Cursor sometimes opens docs before language contributions settle.
  setTimeout(() => { void rebindAllOpenSynFiles(); }, 500);
  setTimeout(() => { void rebindAllOpenSynFiles(); }, 2000);
}

function deactivate() {}

module.exports = { activate, deactivate };
