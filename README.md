
node scripts/checkPhrasesEnS.js "/path/to/project"

node scripts/checkGameName.js "/path/to/project/locale/mobile_gui" "3 Luxor Scarabs: Hold and Win" "3只幸运甲虫：赢得胜利"

Для работы в Jenkins можно использовать те же переменные среды.

Конфигурация Jenkins Job:
Добавьте параметры:

LOCALE_DIR: /path/to/project/locale/mobile_gui
GAME_NAME: 3 Luxor Scarabs: Hold and Win
GAME_NAME_CN: 3只幸运甲虫：赢得胜利

Команда для выполнения:
npm run check-phrases-ens /Users/r.derkach/Work/Github/games/lion_gems
npm run check-game-name /Users/r.derkach/Work/Github/games/lion_gems/locale/mobile_gui "3 Luxor Scarabs: Hold and Win" "3只幸运甲虫：赢得胜利"
npm run check-cert-words /Users/r.derkach/Work/Github/games/lion_gems/locale/paytable
