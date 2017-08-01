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
var defaultDicts = {
  'Cambridge'        : 'http://dictionary.cambridge.org/search/english-russian/direct/?q=',
  'Oxford'           : 'http://www.oxfordlearnersdictionaries.com/search/english/?q=',
  'SkELL'            : 'https://skellm.sketchengine.co.uk/run.cgi/concordance?query=',
  'Lingvo'           : 'https://www.lingvolive.com/ru-ru/translate/en-ru/',
  'Google Translate' : 'https://translate.google.com/#en/ru/',
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
  PropertiesService.getUserProperties().setProperties(defaultDicts, true);

  onOpen(e);
}

/**
 * Opens a sidebar in the document containing the add-on's user interface.
 */
function showSidebar() {
  // Construct a sidebar.
  var html = ' \
  <html> \
    <head> \
      <script> \
        function openLink(url) { \
          window.open(url, "_blank"); \
        } \
      </script> \
      <style> \
        input  { width: 100%; margin-bottom: 16px; } \
        body   { background-color: WhiteSmoke; margin-top: 16px; } \
        footer { position:fixed; bottom:0; left:8px; } \
      </style> \
    </head> \
    <body> \
      <form>';
  var dicts = PropertiesService.getUserProperties().getProperties();
  for (var key in dicts) {
    html += Utilities.formatString(' \
        <input type="button" value="%s" \
        onClick="google.script.run.withSuccessHandler(openLink).getLookupLink(\'%s\')" />'
    , key, dicts[key]
    );
  }
  html += ' \
      </form><footer> \
        <input type="button" style="width:120px" value="Preferences" \
        onclick="google.script.run.showSettings()" /> \
        <a href="https://github.com/in4lio/dictionary-lookup/" target="blank">Home</a> \
      </footer> \
    </body> \
  </html>';

  var ui = HtmlService.createHtmlOutput(html).setTitle('Lookup');
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
  return url + getLookupText();
}

function showSettings() {
  var html = ' \
    <h2>Under construction.</h2><br> \
    <input type="button" value="Save" onclick="google.script.host.close()" /> \
    <input type="button" value="Cancel" onclick="google.script.host.close()" />';

  var ui = HtmlService.createHtmlOutput(html).setWidth(400).setHeight(500);
  DocumentApp.getUi().showModalDialog(ui, 'Preferences');
}
