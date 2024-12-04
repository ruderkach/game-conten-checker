const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

// Конфигурация языков и замен
const languageConfig = {
    en: {
        certs: {
            gbr: ['PRIZES', 'PRIZE', 'Prize'],
            ltu: ['PRIZES', 'PRIZE', 'Prize'],
            en: ['JACKPOTS', 'JACKPOT', 'Jackpot'],

        },
        mappings: {
            JACKPOTS: ['PRIZES'],
            JACKPOT: ['PRIZE'],
            Jackpot: ['Prize'],
        },
    },
    de: {
        certs: {
            deu: ['HAUPTGEWINNE', 'HAUPTGEWINN', 'Hauptgewinn'],
            de: ['JACKPOTS', 'JACKPOT', 'Jackpot'],

        },
        mappings: {
            JACKPOTS: ['HAUPTGEWINNE'],
            JACKPOT: ['HAUPTGEWINN'],
            Jackpot: ['Hauptgewinn'],
        },
    },
    ru: {
        certs: {
            blr: ['ПРИЗЫ', 'ПРИЗ', 'Приз'],
            ru: ['ДЖЕКПОТЫ', 'ДЖЕКПОТ', 'Джекпот'],

        },
        mappings: {
            ДЖЕКПОТЫ: ['ПРИЗЫ'],
            ДЖЕКПОТ: ['ПРИЗ'],
            Джекпот: ['Приз'],
        },
    },
    hr: {
        certs: {
            hrv: ['NAGRADNI', 'NAGRADA', 'Nagrada'],
            hr: ['JACKPOTI', 'JACKPOT', 'Jackpot'],

        },
        mappings: {
            JACKPOTI: ['NAGRADNI'],
            JACKPOT: ['NAGRADA'],
            Jackpot: ['Nagrada'],
        },
    },
    es: {
        certs: {
            esp: ['PREMIOS', 'PREMIO', 'Premio'],
            es: ['JACKPOTS', 'JACKPOT', 'Jackpot'],

        },
        mappings: {
            JACKPOTS: ['PREMIOS'],
            JACKPOT: ['PREMIO'],
            Jackpot: ['Premio'],
        },
    },
    pt: {
        certs: {
            prt: ['PRÊMIOS', 'PRÊMIO', 'Prêmio'],
            pt: ['JACKPOTS', 'JACKPOT', 'Jackpot'],

        },
        mappings: {
            JACKPOTS: ['PRÊMIOS'],
            JACKPOT: ['PRÊMIO'],
            Jackpot: ['Prêmio'],
        },
    },
    bg: {
        certs: {
            bgr: ['НАГРАДИ', 'НАГРАДА', 'Награда'],
            bg: ['ДЖАКПОТ', 'ДЖАКПОТ', 'Джакпот'],

        },
        mappings: {
            ДЖАКПОТ: ['НАГРАДИ'],
            ДЖАКПОТ: ['НАГРАДА'],
            Джакпот: ['Награда'],
        },
    },
    da: {
        certs: {
            dnk: ['PRÆMIER', 'PRÆMIE', 'Præmie'],
            da: ['JACKPOTS', 'JACKPOT', 'Jackpot'],

        },
        mappings: {
            JACKPOTS: ['PRÆMIER'],
            JACKPOT: ['PRÆMIE'],
            Jackpot: ['Præmie'],
        },
    },
    it: {
        certs: {
            ita: ['PREMI', 'PREMIO', 'Premio'],
            it: ['JACKPOT', 'JACKPOT', 'Jackpot'],

        },
        mappings: {
            JACKPOT: ['PREMI'],
            JACKPOT: ['PREMIO'],
            Jackpot: ['Premio'],
        },
    },
    sv: {
        certs: {
            swe: ['PRISER', 'PRIS', 'Pris'],
            sv: ['JACKPOTTAR', 'JACKPOTT', 'Jackpott'],

        },
        mappings: {
            JACKPOTTAR: ['PRISER'],
            JACKPOTT: ['PRIS'],
            Jackpott: ['Pris'],
        },
    },
    nl: {
        certs: {
            nld: ['PRIJZEN', 'PRIJS', 'Prijs'],
            nl: ['JACKPOT', 'JACKPOT', 'Jackpot'],

        },
        mappings: {
            JACKPOT: ['PRIJZEN'],
            JACKPOT: ['PRIJS'],
            Jackpot: ['Prijs'],
        },
    },
};

// Получение аргументов командной строки
const args = process.argv.slice(2);
const localeDir = args[0];

if (!localeDir) {
    console.error("❌ Укажите директорию с локализационными файлами.");
    process.exit(1);
}

if (!fs.existsSync(localeDir) || !fs.lstatSync(localeDir).isDirectory()) {
    console.error(`❌ Указанная директория "${localeDir}" не существует или не является папкой.`);
    process.exit(1);
}

// Парсинг XML файла
async function parseXmlFile(filePath) {
    const xmlContent = fs.readFileSync(filePath, "utf-8");
    return xml2js.parseStringPromise(xmlContent);
}

// Проверка строки с дефолтными словами
function checkStringTag(stringTag, langConfig) {
    const certs = langConfig.certs || {};
    const mappings = langConfig.mappings || {};
    const defaultWords = certs.en || [];
    const certParams = Object.keys(certs);
    const results = [];
    const foundCerts = {};

    // Поиск дефолтных слов в теге
    const allWords = stringTag.string?.map((tag) => tag._?.trim()) || [];
    const foundDefaults = allWords.filter((word) => defaultWords.includes(word));

    if (foundDefaults.length === 0) {
        return { valid: true, reason: "Дефолтные слова отсутствуют", results: [] };
    }

    // Проверка всех cert в текущем теге
    certParams.forEach((cert) => {
        const validWords = certs[cert];
        const certTag = stringTag.string?.find((tag) => tag.$?.cert === cert);

        if (certTag) {
            const word = certTag._?.trim();
            if (validWords.includes(word)) {
                foundCerts[cert] = word;
                results.push({ cert, word, valid: true });
            } else {
                results.push({ cert, word, valid: false });
            }
        } else {
            results.push({ cert, word: null, valid: false });
        }
    });

    // Проверка соответствий дефолтных слов и кастомных значений
    Object.entries(mappings).forEach(([defaultWord, validReplacements]) => {
        if (foundDefaults.includes(defaultWord)) {
            const matches = allWords.filter((word) => validReplacements.includes(word));
            if (matches.length > 0) {
                results.push({ defaultWord, matches, valid: true });
            } else {
                results.push({ defaultWord, matches, valid: false });
            }
        }
    });

    return { valid: results.every((r) => r.valid), reason: "", results };
}

// Проверка всех файлов
async function checkLocaleFiles() {
    const files = fs.readdirSync(localeDir).filter((file) => file.endsWith(".xml"));
    if (files.length === 0) {
        console.error("❌ В указанной директории отсутствуют XML-файлы.");
        process.exit(1);
    }

    for (const file of files) {
        const lang = path.basename(file, ".xml");
        const langConfig = languageConfig[lang];
        if (!langConfig) {
            // console.log(`ℹ️ Пропускаем файл ${file}, язык не указан в конфигурации.`);
            continue;
        }

        console.log(`🔍 Проверяем файл: ${file}`);
        const filePath = path.join(localeDir, file);
        const parsedXml = await parseXmlFile(filePath);

        const stringTags = parsedXml.config?.string || [];
        let validFile = true;

        stringTags.forEach((stringTag) => {
            const { valid, reason, results } = checkStringTag(stringTag, langConfig);

            if (!valid && reason !== "Дефолтные слова отсутствуют") {
                validFile = false;
                console.error(`❌ Ошибка в ID="${stringTag.$?.id || "нет ID"}"`);
                results.forEach((result) => {
                    console.error(
                        `    ➡️ cert="${result.cert || result.defaultWord}" слово="${result.word || result.matches}" валидно=${result.valid}`
                    );
                });
            }
        });

        if (validFile) {
            console.log(`✅ Файл ${file} успешно прошел проверку.`);
        } else {
            console.error(`❌ Файл ${file} содержит ошибки.`);
        }
    }
}

// Запуск проверки
checkLocaleFiles().catch((error) => {
    console.error("❌ Ошибка проверки файлов:", error);
});