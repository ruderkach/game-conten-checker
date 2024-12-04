const fs = require('fs');
const path = require('path');

// Getting parameters from the command line or environment variables
const localeDir = process.argv[2] || process.env.LOCALE_DIR;
const gameName = process.argv[3] || process.env.GAME_NAME;
const gameNameChinese = process.argv[4] || process.env.GAME_NAME_CN;

// Checking whether the path to the localization directory is specified
if (!localeDir) {
    console.error('❌ Specify the path to the directory with localizations as the first parameter or through the LOCALE_DIR environment variable');
    process.exit(1);
}

// A function to check the name of the game in the file
function checkGameName(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const isChineseLocale = filePath.includes('zh'); // Checking if the locale is Chinese

        const expectedName = isChineseLocale ? gameNameChinese : gameName;
        const regex = new RegExp(`id="GUI_GAME_NAME"[^>]*>${expectedName}<`);

        if (!regex.test(content)) {
            console.error(`❌ Error in the file ${path.basename(filePath)}: the name "${expectedName}" was expected`);
            return false;
        }

        console.log(`✅ The name of the game is correct in the file ${path.basename(filePath)}`);
        return true;
    } catch (error) {
        console.error(`Error processing the file ${filePath}: ${error.message}`);
        return false;
    }
}

// The main function for checking all files
function checkAllFiles(directory) {
    if (!fs.existsSync(directory)) {
        console.error(`❌ The specified directory does not exist: ${directory}`);
        process.exit(1);
    }

    const files = fs.readdirSync(directory).filter(file => file.endsWith('.xml'));

    if (files.length === 0) {
        console.error(`❌ No XML files found in the ${directory}`);
        process.exit(1);
    }

    let allFilesValid = true;

    files.forEach(file => {
        const filePath = path.join(directory, file);
        const isValid = checkGameName(filePath);
        if (!isValid) allFilesValid = false;
    });

    if (allFilesValid) {
        console.log('\n🎉 All files are correct');
        process.exit(0);
    } else {
        console.error('\n🚨 There are errors in localizations');
        process.exit(1);
    }
}

// Starting the check
checkAllFiles(localeDir);
