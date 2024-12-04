const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');
const path = require('path');

// Downloading forbidden phrases
function loadForbiddenPhrases(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  } catch (error) {
    console.error(`❌ File reading error ${filePath}:`, error.message);
    process.exit(1);
  }
}

// Downloading and parsing XML
function loadXML(filePath) {
  const parser = new XMLParser({
    ignoreAttributes: false, // Saving attributes
    attributeNamePrefix: '@_', // Attributes will start with @_ (for example, @_id)
  });

  try {
    const xmlData = fs.readFileSync(filePath, 'utf-8');
    return parser.parse(xmlData);
  } catch (error) {
    console.error(`❌ File reading error ${filePath}:`, error.message);
    return null;
  }
}

// Checking for prohibited phrases
function checkForForbiddenPhrases(xmlContent, forbiddenPhrases, filePath) {
  const strings = xmlContent?.config?.string; // Access to <string> tags inside <config>
  if (!strings) {
    console.error(`❌ <string> tags were not found in the file ${filePath}.`);
    return;
  }

  let foundPhrases = [];
  const stringArray = Array.isArray(strings) ? strings : [strings]; // We take into account the case if the <string> tag is one

  stringArray.forEach(element => {
    const textContent = element['#text'] || ''; // The content of the text or empty
    forbiddenPhrases.forEach(phrase => {
        if (typeof textContent === 'string' && textContent.includes(phrase)) { // Check the @_id attribute
            foundPhrases.push({ id: element['@_id'], phrase }); // Using the @_id attribute
        }
    });
  });

  if (foundPhrases.length > 0) {
    console.error(`❌ Forbidden phrases found in the ${filePath} file:`);
    foundPhrases.forEach(item => {
      console.log(`ID: ${item.id} - Phrase: "${item.phrase}"`);
    });
  } else {
    console.log(`✅ Forbidden phrases were not found in the file ${filePath}.`);
  }
}

// The basic logic
const forbiddenPhrases = loadForbiddenPhrases(path.join(__dirname, 'forbiddenPhrases.txt'));
const projectDir = process.argv[2];

if (!projectDir) {
  console.error('Specify the path to the project.');
  process.exit(1);
}

function findXMLFiles(dir) {
  const files = fs.readdirSync(dir);
  let xmlFiles = [];
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      xmlFiles = xmlFiles.concat(findXMLFiles(fullPath)); // Recursive search
    } else if (file === 'en_s.xml') { // We check only files with the name en_s.xml
      xmlFiles.push(fullPath);
    }
  });
  return xmlFiles;
}

const xmlFiles = findXMLFiles(projectDir);
xmlFiles.forEach(filePath => {
  const xmlContent = loadXML(filePath);
  if (xmlContent) {
    checkForForbiddenPhrases(xmlContent, forbiddenPhrases, filePath);
  }
});
