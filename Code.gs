/*
 * Dictionary Lookup -- Search for a word in online dictionaries.
 * https://github.com/in4lio/dictionary-lookup
 *
 * Based on Google "mobile-translate" sample and a couple of advice from StackOverflow.
 *
 * @OnlyCurrentDoc
 */

/**
 * List of default dictionaries.
 */
var defaultSettings = {
  'count' : '10',
  'dict0' : 'Cambridge,        http://dictionary.cambridge.org/search/english-russian/direct/?q=%s',
  'dict1' : 'Oxford,           http://www.oxfordlearnersdictionaries.com/search/english/?q=%s',
  'dict2' : 'SkELL,            https://skellm.sketchengine.co.uk/run.cgi/concordance?query=%s',
  'dict3' : 'Lingvo,           https://www.lingvolive.com/ru-ru/translate/en-ru/%s',
  'dict4' : 'Google Translate, https://translate.google.com/#en/ru/%s',
};

/**
 * Creates a menu entry in the Google Docs UI when the document is opened.
 */
function onOpen(e) {
  DocumentApp.getUi().createAddonMenu()
  .addItem('Start', 'showSidebar')
  .addToUi();
}

/**
 * Runs when the add-on is installed.
 */
function onInstall(e) {
  // Set default dictionaries for current user.
  PropertiesService.getUserProperties().setProperties(defaultSettings, true);

  onOpen(e);
}

/**
 * Opens a sidebar in the document containing the add-on's user interface.
 */
function showSidebar() {
  var ui = HtmlService.createTemplateFromFile('Sidebar').evaluate().setTitle('Lookup');
  DocumentApp.getUi().showSidebar(ui);
}

/**
 * Gets a word at the position.
 *
 * @return <string> The word or an empty string.
 */
function getWordAt(str, pos) {
  // Search for the word's beginning and end.
  var left = str.slice(0, pos + 1).search(/\S+$/),
      right = str.slice(pos).search(/\s/);
  // The last word in the string is a special case.
  if (right < 0) {
      return str.slice(left);
  }
  // Return the word, using the located bounds to extract it from the string.
  return str.slice(left, right + pos);
}

/**
 * Gets a text that the user has selected or a word under the cursor.
 *
 * @return <string> The selected text or the word under the cursor or the empty string.
 */
function getLookupText() {
  // Get selected text.
  var selection = DocumentApp.getActiveDocument().getSelection();
  if (selection) {
    var text = [];
    var elements = selection.getSelectedElements();
    for (var i = 0; i < elements.length; i++) {
      if (elements[i].isPartial()) {
        var element = elements[i].getElement().asText();
        var startIndex = elements[i].getStartOffset();
        var endIndex = elements[i].getEndOffsetInclusive();

        text.push(element.getText().substring(startIndex, endIndex + 1));
      } else {
        var element = elements[i].getElement();
        // Only translate elements that can be edited as text; skip images and other non-text elements.
        if (element.editAsText) {
          var elementText = element.asText().getText();
          // This check is necessary to exclude images, which return a blank text element.
          if (elementText != '') {
            text.push(elementText);
          }
        }
      }
    }
    if (text.length > 0) {
      return text.join('\n');
    }
  }
  // Or get a word under the cursor.
  var cursor = DocumentApp.getActiveDocument().getCursor();
  if (cursor) {
    return getWordAt(cursor.getSurroundingText().getText(), cursor.getSurroundingTextOffset());
  }
  return '';
}

function getLookupLink(url) {
  if (url) return Utilities.formatString(url, getLookupText());
  throw new Error( "Empty URL." );
}

function showSettings() {
  var ui = HtmlService.createTemplateFromFile('Settings').evaluate().setWidth(600).setHeight(400);
  DocumentApp.getUi().showModalDialog(ui, 'Preferences');
}

function saveSettings(form) {
  var userProperties = PropertiesService.getUserProperties();

  for (var i = 0; i < userProperties.getProperty('count'); i++) {
    var caption = form['caption' + i].trim();
    var url = form['url' + i].trim();
    if (caption) {
      userProperties.setProperty('dict' + i, caption + ',' + url);
    } else {
      userProperties.deleteProperty('dict' + i);
    }
  }
  showSidebar();
}
