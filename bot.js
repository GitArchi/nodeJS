import {Telegraf} from 'telegraf'
import nodemailer from 'nodemailer'
import request from 'request'
import mysql from 'mysql2'

//Connect to DB (Params)
const connection = mysql.createConnection({
    host: "0.0.0.0",
    user: "user",
    database: "db",
    password: "dfjlkf"
});


const bot = new Telegraf('TOKEN');
let parseNumb = 0;
let lastName = [];
let global = [];
let bufId = 0;
let bufRes = 0;

//Подключаем логирование (Инфа выводится в консоль ввиде Json объектов)
bot.use(Telegraf.log());

//Точка входа в бота. Нажимаем кнопку START в мессенджере, бот начинает работу.
bot.command('start', (ctx) => {
    const user_id = ctx.chat.id;
    const userText = ctx.message.message_id;
    const res = userText - 1;
    connection.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `select user_id
                   from data
                   where auth = 1
                     and user_id = ${user_id}`;
        connection.query(sql, function (err, result) {
            if (err) throw err;
            if (result.length === 0) {
                var res = 0;
            } else {
                console.log(result);
                res = result[0]['user_id'];
            }
            workWithResult(res);
        });
    });

    function workWithResult(result) {
        bufId = result;
        if (user_id === result) {
            ctx.deleteMessage();
            ctx.telegram.sendMessage(ctx.chat.id, 'Вы уже авторизованы! Вернитесь в главное меню.',
                {
                    reply_markup: {
                        inline_keyboard: [
                            [{
                                text: "Главное меню 🏠", callback_data: "Authorize"
                            }]
                        ],
                    }
                })
            bot.telegram.deleteMessage(ctx.chat.id, res);
        } else if (result === 0) {
            ctx.deleteMessage();
            ctx.telegram.sendMessage(ctx.chat.id, `Здравствуйте,  ${ctx.from.first_name}! Для продолжения работы помощника, Вам следует авторизоваться. Для этого, введите свой табельный номер и нажмите кнопку отправить сообщение.`)
        }
        return bufId;
    }
})

//Обработка вводимого текста, стоит защита от "Дурака" и проверка ID из табюлицы авторизованных
bot.on('text', async (ctx) => {
    let userId = ctx.chat.id;
    let userText = ctx.message.text
    const id_repeate = ctx.message.message_id;
    const firstName = ctx.from.first_name;
    const userName = ctx.from.username;
    const res = id_repeate - 1;
    //Reg on
    if (!userText.match('\\b\\d\\d\\d\\d\\d\\d')) {
        let user_id2 = ctx.chat.id;
        connection.connect(function (err) {
            if (err) throw err;
            console.log("Connected!");
            var sql = `select user_id
                       from data
                       where auth = 1
                       and user_id = ${user_id2}`;
            connection.query(sql, function (err, result) {
                if (err) throw err;
                if (result.length === 0) {
                    var res = 0;
                } else {
                    console.log(result);
                    res = result[0]['user_id'];
                }
                workWithResult2(res);
            });
        });

        function workWithResult2(result) {
            bufRes = result
            return bufRes;
        }

        if (user_id2 === bufRes && userText != null) {
            bot.telegram.deleteMessage(ctx.chat.id, res);
            ctx.deleteMessage();
            ctx.telegram.sendMessage(ctx.chat.id, `Функция поиска недоступна!`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [{
                                text: "Главное меню 🏠", callback_data: "Authorize"
                            }]
                        ],
                    }
                })
            bot.telegram.deleteMessage(ctx.chat.id, res);
            //RegExp
        } else {
            parseNumb = parseInt(userText.match(/\d+/));
            lastName = userText.match(/[А-я]+/gm);
            ctx.deleteMessage();
            var options = {
                'method': 'POST',
                'url': 'http://xxxxxx',
                'headers': {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "action": "xxxxxxxx",
                    "last_name": `${lastName[0]}`,
                    "tnumber": `${parseNumb}`
                })
            };
            request(options, function (error, response) {
                if (error) throw new Error(error);
                let responses = response.body
                let parseResponse = responses.match('\\b\\d\\d\\d\\d\\d\\d');
                global.push({
                    resp111: `${parseResponse}`,
                })
            });
            bot.telegram.deleteMessage(ctx.chat.id, res);
            ctx.deleteMessage();
            ctx.telegram.sendMessage(ctx.chat.id, `Введите код, отправленый на Ваш мобильный номер`)
        }
    } else {
        console.log(global[0]['resp111'])
        if (userText === global[0]['resp111'] && global[0]['resp111'].length === 6) {
            connection.connect(function (err) {
                if (err) throw err;
                console.log("Connected!");
                var sql = `INSERT INTO data (user_id, full_name, username, last_name, tnum, auth)
                           VALUES ('${userId}', '${firstName}', '${userName}', '${lastName}', '${parseNumb}',
                                   '1')`;
                console.log(sql)
                connection.query(sql, function (err) {
                    if (err) throw err;
                    console.log(err)
                });
            });
            ctx.deleteMessage();
            bot.telegram.deleteMessage(ctx.chat.id, res);
            ctx.telegram.sendMessage(ctx.chat.id, `Вы успешно зарегистрированы! ✅ ${firstName}, рады Вас видеть!`, {
                reply_markup: {
                    inline_keyboard: [
                        [{
                            text: "Начать работу", callback_data: "Authorize"
                        }]
                    ],
                }
            })
            global = [];
        } else {
            bot.telegram.deleteMessage(ctx.chat.id, res);
            ctx.telegram.sendMessage(ctx.chat.id, 'Вводимый код не верен! ❌ Пожалуйста, попробуйте снова...')
            ctx.deleteMessage();
        }
    }
})

//Основное меню бота
bot.action('Authorize', (ctx) => {
    ctx.deleteMessage()
    ctx.telegram.sendMessage(ctx.chat.id, 'Выберите нужный вам пункт меню ✅ ',
        {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: "↪ Хранение документов", callback_data: "Doc"
                    }],
                    [{
                        text: "Выслать повторно QR Code 3CX", callback_data: "qr3cx"
                    }],
                    [{
                        text: "Корпоротивный портал", callback_data: "Corp"
                    }],
                    [{
                        text: "База знаний по ERP системе", callback_data: "Erp"
                    }],
                    [{
                        text: "↪ Контакты служб", callback_data: "Service"
                    }],
                ]
            }
        });
})
//Подменю с доками
bot.action('Doc', (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(ctx.chat.id, 'Выберите нужный вам пункт меню ✅ ',
        {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: "Хранение Ваших файлов и документации", callback_data: "lich"
                    }],
                    [{
                        text: "Обмен док. с коллегами из Вашего отдела", callback_data: "in"
                    }],
                    [{
                        text: "Обмен док. с коллегами из других отделов", callback_data: "out"
                    }],
                    [{
                        text: "Каталоги -По запросу-", callback_data: "zapros"
                    }],
                    [{
                        text: "Главное меню 🏠", callback_data: "Authorize"
                    }],
                ]
            }
        });
})

//Подменю с контактами служб
bot.action('Service', (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(ctx.chat.id, 'Выберите нужный вам пункт меню ✅ ',
        {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: "Служба тех. поддержки", callback_data: "sdhelp"
                    }],
                    [{
                        text: "СГИ", callback_data: "sgi"
                    }],
                    [{
                        text: "Канцелярия", callback_data: "chan"
                    }],
                    [{
                        text: "Отдел кадров", callback_data: "ok"
                    }],
                    [{
                        text: "Бухгалтерия", callback_data: "buh"
                    }],
                    [{
                        text: "Главное меню 🏠", callback_data: "Authorize"
                    }],
                ]
            }
        });
})

//--------------Обработчики событий с доками-------------
bot.action('lich', (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(ctx.chat.id, 'Ваши данные необходимо хранить в личной папке. ' +
        'Вы можете найти свою именную папку для хранения различных данных в каталоге - Библиотека_документов\\ Персональные_документы, ' +
        'её название повторяет ваше имя пользователя. (Ваша папка доступна только на корпоративных рабочих местах).',
        {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: "⬅ Назад ", callback_data: "Doc"
                    }],
                ]
            },


        })
})
bot.action('in', (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(ctx.chat.id, 'Общий каталог вашего отдела вы можете найти по адресу - ' +
        'Документы_отдела (Каталог доступен только на корпоративных рабочих местах).',
        {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: "⬅ Назад ", callback_data: "Doc"
                    }],
                ]
            }

        })
})
bot.action('out', (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(ctx.chat.id, 'Каталоги для обмена документами, внутри подразделений или со всеми сотрудниками - ' +
        'Обмен_документами (Каталог доступен только на корпоративных рабочих местах).',
        {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: "⬅ Назад ", callback_data: "Doc"
                    }],
                ]
            }

        })
})
bot.action('zapros', (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(ctx.chat.id, 'Отдельные папки для коллективного хранения и использования данных различными ' +
        'группами сотрудников находятся по адресу (вы увидите только те, к которым у вас имеется доступ) - ' +
        'По_запросу (Каталог доступен только на корпоративных рабочих местах).',
        {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: "⬅ Назад ", callback_data: "Doc"
                    }],
                ]
            }

        })
})
//-------------------------------------------------------

//Обработчик события инфы по порталу
bot.action('Corp', (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(ctx.chat.id, 'Для того, чтобы попасть на наш корпоративный портал вам нужно перейти по ссылке - ' +
        '(Перейти по ссылке можно посредством любого браузера, но только с корпоративного рабочего места).',
        {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: "⬅ Назад ", callback_data: "Authorize"
                    }],
                ]
            }

        })
})
//Обработчик события инфы по ERP
bot.action('Erp', (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(ctx.chat.id, 'Портал содержащий базу знаний по ERP-системе вы можете найти по ссылке - ' +
        '(Перейти по ссылке можно посредством любого браузера, но только с корпоративного рабочего места).',
        {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: "⬅ Назад ", callback_data: "Authorize"
                    }],
                ]
            }

        })
})

//--------------Обработчики событий с контактами----------
bot.action('sdhelp', (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(ctx.chat.id, 'При возникновении каких-либо проблем с техническим оснащением ваших рабочим мест; ' +
        'неполадок или вопросов по работе программного обеспечения; отсутствии доступа к каким-либо сервисам или услугам – обязательно ' +
        'сообщите нам о них, оставив заявку посредством написания электронного письма на почту (внутренний) ' +
        'или ',
        {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: "⬅ Назад ", callback_data: "Service"
                    }],
                ]
            }

        })
})
bot.action('sgi', (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(ctx.chat.id, 'По вопросам касательно мебели, электропитания, освещения и других хоз.нужд необходимо обращаться ' +
        'в Службу Главного Инженера, посредством написания электронного письма на почту',
        {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: "⬅ Назад ", callback_data: "Service"
                    }],
                ]
            }

        })
})
bot.action('chan', (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(ctx.chat.id, 'Если у вас возникли вопросы, касающиеся канцелярии, позвоните' +
        'пожалуйста по номеру. В голосовом меню IVR выберете интересующий Вас раздел.',
        {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: "⬅ Назад ", callback_data: "Service"
                    }],
                ]
            }

        })
})
bot.action('ok', (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(ctx.chat.id, 'Если у вас возникли вопросы, касающиеся отдела кадров, позвоните' +
        'пожалуйста по номеру В голосовом меню IVR выберете интересующий Вас раздел',
        {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: "⬅ Назад ", callback_data: "Service"
                    }],
                ]
            }

        })
})
bot.action('buh', (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(ctx.chat.id, 'Если у вас возникли вопросы, касающиеся бухгалтерии, позвоните' +
        'пожалуйста по номеру В голосовом меню IVR выберете интересующий Вас раздел',
        {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: "⬅ Назад ", callback_data: "Service"
                    }],
                ]
            }

        })
})
//-------------------------------------------------------

//--------------Обработчики событий 3 CX-----------------
bot.action('qr3cx', (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(ctx.chat.id, 'Если у Вас имеется учетная запись, Вы может повторно запросить QRCode. В случае отсутсвия учетной записи, нажмите кнопку создать учетную запись.',
        {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: "Выслать повторно QR Code на почту", callback_data: "repeat"
                    }],
                    [{
                        text: "Создать учетную запись 3Cx ", callback_data: "create"
                    }],
                    [{
                        text: "⬅ Назад ", callback_data: "Authorize"
                    }],
                ]
            }

        })
})
bot.action('create', (ctx) => {
    ctx.deleteMessage();
    ctx.telegram.sendMessage(ctx.chat.id, 'Схема работы: 1) При входящем звонке звонит стационарный телефон и 3CX приложение на моем телефоне. 2) При входящем звонке звонит стационарный телефон, далее, через 3-4 секунды звонит приложение 3Cx.',
        {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: " Android 💻 1 Вариант", callback_data: "android1"
                    }],
                    [{
                        text: " Android 💻 2 Вариант", callback_data: "android2"
                    }],
                    [{
                        text: "iOS (Iphone) 🍎 1 Вариант", callback_data: "iphone1"
                    }],
                    [{
                        text: "iOS (Iphone) 🍎 2 Вариант", callback_data: "iphone2"
                    }],
                    [{
                        text: "⬅ Назад ", callback_data: "Authorize"
                    }],
                ]
            }
        })
})
bot.action('android1', (ctx) => {
    ctx.deleteMessage();
    let userId3cx = ctx.chat.id;
    ctx.telegram.sendMessage(ctx.chat.id, 'Письмо о создании учетной записи отправлено в службу поддержки. Через некторое время с Вами свяжутся по электрнной почте.',
        {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: "⬅ Назад ", callback_data: "Authorize"
                    }],
                ]
            }
        })
    connection.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `select tnum
                   from data
                   where auth = 1
                     and user_id = ${userId3cx}`;
        connection.query(sql, function (err, result) {
            if (err) throw err;
            console.log(result);
            var res = result[0]['tnum'];
            cx(res);
        });
    });

    function cx(result) {
        var tnum = result;
        console.log(tnum)

        async function main() {
            let transporter = nodemailer.createTransport({
                host: "0.0.0.0",
                port: 25,
                secure: false,
                tls: {rejectUnauthorized: false},
                auth: {
                    user: '000000',
                    pass: '000000',
                },
            });

            let info = await transporter.sendMail({
                from: '000000',
                to: "000000000",
                subject: `Новая учетная запись 3CX для ${tnum} (Таб. Номер)`,
                html: `Схема работы: При входящем звонке звонит стационарный телефон и 3CX приложение на моем телефоне. ОС - Android (Дописать в коментарии к заявке почту и внутренний номер сотрудника)`,
            });
            console.log("Message sent: %s", info.messageId);
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }

        main().catch(console.error)
    }
})
bot.action('android2', (ctx) => {
    ctx.deleteMessage();
    let userId3cx = ctx.chat.id;
    ctx.telegram.sendMessage(ctx.chat.id, 'Письмо о создании учетной записи отправлено в службу поддержки. Через некторое время с Вами свяжутся по электрнной почте.',
        {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: "⬅ Назад ", callback_data: "Authorize"
                    }],
                ]
            }
        })
    connection.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `select tnum
                   from data
                   where auth = 1
                     and user_id = ${userId3cx}`;
        connection.query(sql, function (err, result) {
            if (err) throw err;
            console.log(result);
            var res = result[0]['tnum'];
            cx(res);
        });
    });

    function cx(result) {
        var tnum = result;
        console.log(tnum)

        async function main() {
            let transporter = nodemailer.createTransport({
                host: "0.0.0.0",
                port: 25,
                secure: false,
                tls: {rejectUnauthorized: false},
                auth: {
                    user: '0.0.0.0',
                    pass: 'fhhf',
                },
            });

            let info = await transporter.sendMail({
                from: '0000000',
                to: "0.0.0.0",
                subject: `Новая учетная запись 3CX для ${tnum} (Таб. Номер)`,
                html: `Схема работы: При входящем звонке звонит стационарный телефон, далее, через 3-4 секунды звонит приложение 3Cx. ОС - Android (Дописать в коментарии к заявке почту и внутренний номер сотрудника)`,
            });

            console.log("Message sent: %s", info.messageId);
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }

        main().catch(console.error)
    }
})
bot.action('iphone1', (ctx) => {
    ctx.deleteMessage();
    let userId3cx = ctx.chat.id;
    ctx.telegram.sendMessage(ctx.chat.id, 'Письмо о создании учетной записи отправлено в службу поддержки. Через некторое время с Вами свяжутся по электрнной почте.',
        {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: "⬅ Назад ", callback_data: "Authorize"
                    }],
                ]
            }
        })
    connection.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `select tnum
                   from data
                   where auth = 1
                     and user_id = ${userId3cx}`;
        connection.query(sql, function (err, result) {
            if (err) throw err;
            console.log(result);
            var res = result[0]['tnum'];
            cx(res);
        });
    });

    function cx(result) {
        var tnum = result;
        console.log(tnum)

        async function main() {
            let transporter = nodemailer.createTransport({
                host: "0.0.0.0",
                port: 25,
                secure: false,
                tls: {rejectUnauthorized: false},
                auth: {
                    user: '0.0.0.0',
                    pass: '0.0.0.0',
                },
            });

            let info = await transporter.sendMail({
                from: '0000000',
                to: "000000",
                subject: `Новая учетная запись 3CX для ${tnum} (Таб. Номер)`,
                html: `Схема работы: При входящем звонке звонит стационарный телефон и 3CX приложение на моем телефоне. ОС - iOS (Дописать в коментарии к заявке почту и внутренний номер сотрудника)`,
            });
            console.log("Message sent: %s", info.messageId);
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }

        main().catch(console.error)
    }
})
bot.action('iphone2', (ctx) => {
    ctx.deleteMessage();
    let userId3cx = ctx.chat.id;
    ctx.telegram.sendMessage(ctx.chat.id, 'Письмо о создании учетной записи отправлено в службу поддержки. Через некторое время с Вами свяжутся по электрнной почте.',
        {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: "⬅ Назад ", callback_data: "Authorize"
                    }],
                ]
            }
        })
    connection.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `select tnum
                   from data
                   where auth = 1
                     and user_id = ${userId3cx}`;
        connection.query(sql, function (err, result) {
            if (err) throw err;
            console.log(result);
            var res = result[0]['tnum'];
            cx(res);
        });
    });

    function cx(result) {
        var tnum = result;
        console.log(tnum)

        async function main() {
            let transporter = nodemailer.createTransport({
                host: "0.0.0.0",
                port: 25,
                secure: false,
                tls: {rejectUnauthorized: false},
                auth: {
                    user: '000000',
                    pass: 'sdfsdfsdf',
                },
            });

            let info = await transporter.sendMail({
                from: '000000',
                to: "00000",
                subject: `Новая учетная запись 3CX для ${tnum} (Таб. Номер)`,
                html: `Схема работы: При входящем звонке звонит стационарный телефон, далее, через 3-4 секунды звонит приложение 3Cx. ОС - iOS (Дописать в коментарии к заявке почту и внутренний номер сотрудника)`,
            });

            console.log("Message sent: %s", info.messageId);
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }

        main().catch(console.error)
    }
})
bot.action('repeat', (ctx) => {
    ctx.deleteMessage();
    let userId3cx = ctx.chat.id;
    ctx.telegram.sendMessage(ctx.chat.id, 'Письмо о просьбе выслать повторно QRCode отправлено в службу технической поддержки. Через некторое время с Вами свяжутся по электронной почте.',
        {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: "⬅ Назад ", callback_data: "Authorize"
                    }],
                ]
            }
        })
    connection.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `select last_name, tnum
                   from data
                   where auth = 1
                     and user_id = ${userId3cx}`;
        connection.query(sql, function (err, result) {
            if (err) throw err;
            console.log(result);
            var res = result[0]['last_name'];
            var tnum = result[0]['tnum']
            cx(res, tnum);
        });
    });

    function cx(result, tnum) {
        var last_name = result;
        var tnNum = tnum;
        console.log(last_name)

        async function main() {
            let transporter = nodemailer.createTransport({
                host: "000000",
                port: 25,
                secure: false,
                tls: {rejectUnauthorized: false},
                auth: {
                    user: '0000',
                    pass: '000000',
                },
            });

            let info = await transporter.sendMail({
                from: '00000',
                to: "0000000000",
                subject: `Просьба выслать повторно QRCode 3CX для ${last_name} таб. номер ${tnNum}`,
                html: `Перекинуть заявку в телефонию.`,
            });

            console.log("Message sent: %s", info.messageId);
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }

        main().catch(console.error)
    }
})
bot.action('mail', (ctx) => {

    async function main() {
        let transporter = nodemailer.createTransport({
            host: "0000000",
            port: 25,
            secure: false,
            tls: {rejectUnauthorized: false},
            auth: {
                user: '00000',
                pass: '000000',
            },
        });

        var attachments = [{
            filename: '0000',
            path: '000000',
            contentType: 'application/jpg'
        }];

        let info = await transporter.sendMail({
            from: '00000000',
            to: "000000",
            subject: "QR Code для приложения 3CX",
            html: "Откройте приложение на своем смартфоне и отсканируйте QRCode. " +
                "Пожалуйста, не отвечайте на это письмо. Оно сформировано автоматически",
            attachments: attachments,
        });

        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

    main().catch(console.error);

})
//-------------------------------------------------------

bot.launch();
