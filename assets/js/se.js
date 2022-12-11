(function () {
    'use strict';

    if (!window.$) throw new Error('jQuery not found.');

    /** application values will be stored in this variable **/
    var _values = {};

    /** application constants **/
    var _constants = {};

    var _http = {};

    var _resources = {};

    var _url = {};

    /** $.se =================== **/
    Object.defineProperty($, 'se', {
        value: Object.freeze({
            /** utils namespace **/
            utils: {
                /**
                 * Clone Object, Date, Array and RegEx value
                 * @param {Array|RegExp|Object|Date}
                 * @returns {Array|RegExp|Object|Date}
                 */
                clone: function (obj) {
                    var result;
                    var toString = Object.prototype.toString;

                    switch (typeof obj) {
                        case 'object':
                            if (obj === null) {
                                // null => null
                                result = null;
                            } else {
                                switch (toString.call(obj)) {
                                    case '[object Array]':
                                        // It's an array, create a new array with
                                        // deep copies of the entries
                                        result = obj.map($.se.utils.clone);
                                        break;
                                    case '[object Date]':
                                        // Clone the date
                                        result = new Date(obj);
                                        break;
                                    case '[object RegExp]':
                                        // Clone the RegExp
                                        result = new RegExp(obj);
                                        break;
                                    // ...probably a few others
                                    default:
                                        // Some other kind of object, deep-copy its
                                        // properties into a new object
                                        result = Object.keys(obj).reduce(function (prev, key) {
                                            prev[key] = $.se.utils.clone(obj[key]);
                                            return prev;
                                        }, {});
                                        break;
                                }
                            }
                            break;

                        default:
                            result = obj; // It's a primitive, copy via assignment
                            break;
                    }

                    return result;
                },
                /**
                 * Parse string to object
                 * String example: "firstName=Supot&lastName=Sukvaree"
                 * Output: {firstName: 'Supot', lastName: 'Sukvaree'}
                 *
                 * @param {String} str
                 * @returns {Object}
                 */
                parseObject: function (str) {
                    var props = str.split('&');
                    var obj = {};

                    props.forEach(function (prop) {
                        var tup = prop.split('=');
                        obj[tup[0]] = tup[1];
                    });

                    return obj;
                },
            },

            js: {
                /**
                 * Load JS file from server
                 * @param {String} url
                 * @param {Funtion} callback
                 * @returns {undefined}
                 */
                load: function (url, callback) {
                    var random = Math.floor(Math.random() * 1000);
                    var el = document.createElement('script');
                    el.setAttribute('type', 'text/javascript');
                    el.setAttribute('src', url + '.js?se=' + random);
                    if (callback) {
                        el.onload = callback;
                    }

                    document.getElementsByTagName('head')[0].appendChild(el);
                },
                /**
                 * Load JS files in order
                 * @param {Array} aScript
                 * @param {Number} startIndex
                 * @param {Function} callback
                 * @returns {undefined}
                 */
                loadSequentially: function (aScript, startIndex, callback) {
                    var $this = this;

                    if (aScript[startIndex]) {
                        var random = Math.floor(Math.random() * 1000);
                        var el = document.createElement('script');
                        el.setAttribute('type', 'text/javascript');
                        el.setAttribute('src', aScript[startIndex] + '.js?se=' + random);

                        el.onload = function () {
                            startIndex = startIndex + 1;
                            $this.loadJSSequentially(aScript, startIndex, callback);
                        };

                        document.getElementsByTagName('head')[0].appendChild(el);
                    } else {
                        callback();
                    }
                },
                /**
                 * Check that the specified JS file is loaded or not
                 * @param {String} jsFile JS file name
                 * @return {Boolean} Returns true if JS fiel is found, and false otherwise
                 */
                isLoaded: function (jsFile) {
                    //get the number of `<script>` elements that have the correct `src` attribute
                    var regExp = new RegExp(jsFile + '.js');
                    var scripts = document.getElementsByTagName('script');

                    for (var i = scripts.length; i--; ) {
                        if (scripts[i].src !== undefined && scripts[i].src.search(regExp) > -1) return true;
                    }

                    return false;
                },
                /**
                 * Check that the specified namespace is loaded or not
                 * @param {String} namespace
                 * @returns {Boolean}
                 */
                isNamespaceExist: function (namespace) {
                    var pieces = namespace.split('.'),
                        context = window;

                    for (var i in pieces) {
                        if (!(context = context[pieces[i]])) {
                            return false;
                        }
                    }

                    return true;
                },
            },

            /** $.se.apiUrl API */
            apiUrl: function (name) {
                name = name || 'base';

                return _url.apiUrl[name];
            },
            /** $.se.baseUrl API **/
            baseUrl: function () {
                return _url.base;
            },
            /** $.se.bootstrap API **/
            bootstrap: function (config) {
                if (config === undefined || config === null || config === {}) {
                    throw new Error('App Configuration undefined. Please check.');
                }

                // Validate important application key
                if (config.hasOwnProperty('constants')) {
                    _constants = Object.freeze(config.constants);
                }

                if (config.hasOwnProperty('values')) {
                    _values = $.se.utils.clone(config.values);
                }

                var base;
                if (config.hasOwnProperty('baseUrl') && typeof config.baseUrl === 'string') {
                    base = config.baseUrl.substr(-1) === '/' ? config.baseUrl : config.baseUrl.concat('/');
                } else {
                    base = document.getElementsByTagName('base')[0].getAttribute('href');
                }

                var apiUrl = config.hasOwnProperty('apiUrl') ? config.apiUrl : {};

                _url = Object.freeze({ base: base, apiUrl: apiUrl });

                var resources = {};
                if (config.hasOwnProperty('resources')) {
                    for (var prop in config.resources) {
                        resources[prop] =
                            config.resources[prop].substr(-1) === '/'
                                ? config.resources[prop]
                                : config.resources[prop].concat('/');
                    }

                    _resources = Object.freeze(resources);
                }

                // HTTP error handlers
                if (config.hasOwnProperty('http')) {
                    _http = Object.freeze(config.http);
                }
            },
            /***
             * Application constants is the value that should never be changed
             *
             * How to read: $.se.constatnt('name');
             *
             * @param {string} name constant key
             * @returns Returns value of given constant name, empty object otherwise.
             */
            constant: function (name) {
                return _constants.hasOwnProperty(name) ? _constants[name] : {};
            },
            /***
             * Resource path for static files
             *
             * How to read: $.se.resource('fileType');
             *
             * @param {string} name file types
             * @returns Returns string if file name found, null otherwise.
             */
            resource: function (name, value) {
                if (value !== undefined && value !== null && typeof value === 'string') {
                    _resources[name] = value.substr(-1) === '/' ? value : value.concat('/');
                } else {
                    return _resources.hasOwnProperty(name) ? _url.base.concat(_resources[name]) : null;
                }
            },
            /***
             * Application values is the value that can be changed
             *
             * How to set:  $.se.value('name', value);
             * How to read: $.se.value('name');
             *
             * @param {string} name
             * @param {any} value
             * @returns {unresolved}
             */
            value: function (name, value) {
                if (value !== undefined && value !== null) {
                    _values[name] = $.se.utils.clone(value);
                } else {
                    return _values.hasOwnProperty(name) ? $.se.utils.clone(_values[name]) : null;
                }
            },
            /** $.se.addPlugin API **/
            addPlugin: function (extendedName, obj) {
                if (typeof obj !== 'object') throw new Error('Invalid Plugin object.');

                // validate existing property
                if (!$.hasOwnProperty(extendedName)) {
                    Object.defineProperty($, extendedName, {
                        value: obj,
                        configurable: true,
                        writable: false,
                    });
                }
            },
            /** $.se.removePlugin API **/
            removePlugin: function (extendedName, obj) {
                if (typeof obj !== 'object') throw new Error('Invalid Plugin object.');

                // validate existing property
                if (!$.hasOwnProperty(extendedName)) {
                    Object.defineProperty($, extendedName, {
                        value: obj,
                        configurable: true,
                        writable: false,
                    });
                }
            },

            component: (function () {
                /** Private Variables **/
                var _currentComponentCall = {}; // Use for store the current ajax for re-request

                return Object.freeze({
                    /**
                     * Load file to the specified element ID
                     * @param {String} id
                     * @param {String} url
                     * @param {String} root Parent DOM
                     * @param {String|Number|Object|Array} initValue Initial data
                     * @param {Function} callback
                     * @returns {undefined}
                     */
                    load: function (id, url, root, initValue, callback) {
                        // Backup the current call
                        _currentComponentCall = {
                            id: id,
                            url: url,
                            root: root,
                            callback: callback,
                        };

                        var el;
                        if ($('#' + id).length > 0) {
                            el = $('#' + id);
                        } else {
                            el = $('<div id="' + id + '"></div>');
                        }

                        var parent = root ? '#'.concat(root) : '#'.concat($.se.constant('rootNode'));
                        $.get(url, function (data) {
                            el.append(data);
                            el.appendTo($(parent));

                            // Add initial data to loaded element
                            initValue = initValue || null;
                            el.data('initialValue', initValue);

                            if (typeof callback === 'function') {
                                callback();
                            }
                        }).error($.se.http.handleError);
                    },
                    /**
                     * Check that the specified component file is loaded or not
                     * @param {String} jsFile JS file name
                     * @return {Boolean} Returns true if JS fiel is found, and false otherwise
                     */
                    isLoaded: function (jsFile) {
                        //get the number of `<script>` elements that have the correct `src` attribute
                        var regExp = new RegExp(jsFile + '.js');
                        var scripts = document.getElementsByTagName('script');

                        for (var i = scripts.length; i--; ) {
                            if (scripts[i].src !== undefined && scripts[i].src.search(regExp) > -1) return true;
                        }

                        return false;
                    },
                });
            })(),

            /**
             * $.se.session
             */
            session: (function () {
                return Object.freeze({
                    clearAll: function () {
                        sessionStorage.clear();
                    },
                    get: function (name) {
                        return sessionStorage.getItem(name);
                    },
                    getJSON: function (name) {
                        var value;
                        try {
                            value = JSON.parse(sessionStorage.getItem(name));
                        } catch (e) {
                            value = null;
                        }

                        return value;
                    },
                    set: function (name, value) {
                        if (value !== undefined && value !== null) {
                            sessionStorage.setItem(name, value);
                        }
                    },
                });
            })(),

            /**
             * $.se.ui API
             */
            ui: (function () {
                /** Private Variables **/
                var _timerId;
                var _currentDisplay;

                var _isBlocked;
                _isBlocked = false;

                /** default loading properties **/
                var _blockOpts = {
                    // message displayed when blocking (use null for no message)
                    message: 'กำลังดาวน์โหลด กรุณารอสักครู่',
                    style: 'iPhoto',
                    delayTime: 1500,

                    // Set TRUE if we would like to work with requirejs
                    requirejs: false,

                    // Set TRUE if we would like to re-initial block UI element
                    forceReload: false,

                    // Callback function after UX was blocked
                    onBlocked: undefined,
                };

                /** default confirm properties **/
                var _confirmOpts = {
                    title: 'โปรดยืนยัน',
                    message: 'ตกลงยืนยันหรือไม่?',

                    // Set TRUE if we need user must input the reason before confirmation
                    requireText: false,

                    // Text that will display when user not input the reason
                    errorText: 'กรุณาป้อนหมายเหตุด้วย',
                    okText: 'ตกลง',
                    cancelText: 'ยกเลิก',
                    onOk: undefined,
                    onCancel: undefined,
                };

                /** default notify properties **/
                var _notifyOpts = {
                    // default waiting 4 seconds
                    delayTime: 4000,

                    // Set TRUE if we would like to stick block UI element
                    sticky: false,
                };

                /** Private Functions **/
                var _addBlock = function (opts) {
                    opts = $.extend({}, _blockOpts, opts);

                    // remove another dialog
                    if (_currentDisplay === 'notify') {
                        _removeNotify();
                    } else if (_currentDisplay === 'confirm') {
                        _removeConfirm();
                    }

                    // clera timer if it blocked for requirejs or force to reload or it needs to stick
                    if (opts.requirejs || opts.forceReload) {
                        _clearTimer();
                    }

                    if (opts.forceReload) {
                        _removeBlock();
                    }

                    // define the blockUI container
                    if (_currentDisplay !== 'block') {
                        var content =
                            '<div class="blockUI-container">' +
                            '<div class="blockUI-dialog ' +
                            opts.style +
                            '">' +
                            '<div>' +
                            opts.message +
                            '</div></div>' +
                            '</div>';

                        $('body').prepend(content);
                        $('.blockUI-container').fadeIn('slow');
                        _currentDisplay = 'block';
                    }

                    // If requirejs is TRUE, timeout will be set up
                    if (opts.requirejs) {
                        _timerId = window.setTimeout(function () {
                            require.onResourceLoad(false);
                        }, opts.delayTime);
                    }

                    // If callback is set
                    if (opts.onBlocked && typeof opts.onBlocked === 'function') {
                        opts.onBlocked();
                    }
                };

                var _addConfirm = function (opts) {
                    opts = $.extend({}, _confirmOpts, opts);

                    var textInput = opts.requireText ? '<input type"text" id="input-text" value="" />' : '';

                    // define the notify container
                    var content = '<div class="confirm-container">'.concat(
                        '<div class="confirm-content">',
                        '<div class="title">' + opts.title + '</div>',
                        '<div class="body">' + opts.message + '</div>',
                        textInput,
                        '<div class="action"><button class="ok">' + opts.okText + '</button>',
                        '<button class="cancel">' + opts.cancelText + '</button></div>',
                        '</div>',
                        '</div>'
                    );
                    $('body').prepend(content);
                    $('.confirm-container').fadeIn('slow');
                    $('#input-text').focus();
                    _currentDisplay = 'confirm';

                    $('.ok').click(function () {
                        if (opts.requireText) {
                            var txt = $('#input-text').val();
                            if (txt === '') {
                                $.se.ui.notify(opts.errorText, 'error');
                                return;
                            }

                            if (typeof opts.onOk === 'function') {
                                _removeConfirm();
                                opts.onOk(txt);
                                return;
                            }
                        }

                        _removeConfirm();

                        if (typeof opts.onOk === 'function') {
                            opts.onOk();
                        }
                    });

                    $('.cancel').click(function () {
                        _removeConfirm();
                        if (typeof opts.onCancel === 'function') opts.onCancel();
                    });
                };

                var _addNotify = function (opts) {
                    opts = $.extend({}, _notifyOpts, opts);

                    // clera timer if it has set
                    if (!opts.sticky) {
                        _clearTimer();
                    }

                    // define the notify container
                    var content =
                        '<div class="notify-message ' +
                        opts.style +
                        '">' +
                        '<div class="box-icon"></div>' +
                        '<p>' +
                        opts.message +
                        '<a href="#" class="close">&times;</a></p>' +
                        '</div>';
                    $('body').prepend(content);
                    $('.notify-message').fadeIn('slow');
                    _currentDisplay = 'notify';

                    $('a.close').click(function (event) {
                        event.preventDefault();
                        _clearTimer();
                        _removeNotify();
                    });

                    if (!opts.sticky) {
                        _timerId = window.setTimeout(function () {
                            _removeNotify();
                        }, opts.delayTime);
                    }
                };

                var _clearTimer = function () {
                    if (typeof _timerId === 'number') {
                        window.clearTimeout(_timerId);
                    }
                };

                var _removeBlock = function () {
                    $('.blockUI-container').fadeOut(function () {
                        $(this).remove();
                    });
                    _currentDisplay = undefined;
                };

                var _removeConfirm = function () {
                    $('.confirm-container').fadeOut(function () {
                        $(this).remove();
                    });
                    _currentDisplay = undefined;
                };

                var _removeNotify = function () {
                    $('.notify-message').fadeOut(function () {
                        $(this).remove();
                    });
                    _currentDisplay = undefined;
                };

                return Object.freeze({
                    /**
                     * This function used for freeze all UI while loading process
                     * @param {object} opts blocking options
                     * @returns void
                     */
                    block: function (msg, opts) {
                        opts = opts || {};

                        if (typeof msg === 'string') {
                            opts.message = msg;
                        } else if (typeof msg === 'object') {
                            $.extend(opts, msg);
                        }

                        _isBlocked = true;
                        _addBlock(opts);
                    },
                    confirm: function (msg, title, onOk, onCancel) {
                        var opts = {};

                        if ($.isEmptyObject(msg)) {
                            throw new Error('Properties that need to work with confirmation dialog is not defined.');
                        } else if (typeof msg === 'string' && typeof title === 'string') {
                            opts.message = msg;
                            opts.title = title;
                            opts.onOk = onOk || undefined;
                            opts.onCancel = onCancel || undefined;
                        } else if (typeof msg === 'object') {
                            $.extend(opts, msg);
                        } else {
                            throw new Error('Invalid confirmation properties. Please check.');
                        }

                        // force requireText to FALSE to prevent the missing usage
                        opts.requireText = false;
                        _addConfirm(opts);
                    },
                    isBlocked: function () {
                        return _isBlocked ? true : false;
                    },
                    notify: function (msg, status, opts) {
                        opts = opts || {};
                        opts.message = msg || undefined;
                        opts.style = status || 'success';
                        _addNotify(opts);
                    },
                    prompt: function (msg, title, onOk, onCancel) {
                        var opts = {};

                        if ($.isEmptyObject(msg)) {
                            throw new Error('Properties that need to work with prompt dialog is not defined.');
                        } else if (typeof msg === 'string' && typeof title === 'string') {
                            opts.message = msg;
                            opts.title = title;
                            opts.onOk = onOk || undefined;
                            opts.onCancel = onCancel || undefined;
                        } else if (typeof msg === 'object') {
                            $.extend(opts, msg);
                        } else {
                            throw new Error('Invalid prompt properties. Please check.');
                        }

                        opts.requireText = true;
                        _addConfirm(opts);
                    },
                    unblock: function () {
                        _isBlocked = false;
                        _removeBlock();
                    },
                });
            })(),

            /**
             * $.se.http
             */
            http: (function () {
                return Object.freeze({
                    header: {
                        getToken: function (data, textStatus, jqXHR) {
                            var token = jqXHR.getResponseHeader('Authorization');
                            if (token) {
                                $.se.session.set('token', token);
                            }

                            return data;
                        },
                        setToken: function () {
                            var token = $.se.session.get('token');
                            return token ? { Authorization: token } : {};
                        },
                    },
                    /**
                     * Used for handle server response error
                     *
                     * @param {object} jqXHR jqXHR object
                     * @param {object} ex
                     * @returns void
                     */
                    handleError: function (jqXHR) {
                        var handlers = _http.errorHandlers;
                        switch (jqXHR.status) {
                            // No Content
                            case 204:
                                if (handlers.onNoContent || typeof handlers.onNoContent === 'function') {
                                    handlers.onNoContent();
                                }
                                break;

                            // Bad Request
                            case 400:
                                if (handlers.onBadRequest || typeof handlers.onBadRequest === 'function') {
                                    handlers.onBadRequest(jqXHR.responseJSON);
                                }
                                break;

                            // Unauthorized
                            case 401:
                                if (handlers.onUnauthorized || typeof handlers.onUnauthorized === 'function') {
                                    handlers.onUnauthorized();
                                }
                                break;

                            // Forbidden
                            case 403:
                                if (handlers.onForbidden || typeof handlers.onForbidden === 'function') {
                                    handlers.onForbidden();
                                }
                                break;

                            // Not Found
                            case 404:
                                $.se.ui.notify('ไม่พบข้อมูลที่ร้องขอ กรุณาติดต่อผู้ดูแลระบบของท่าน', 'error');
                                break;

                            // Unprocessable Entity
                            case 422:
                                if (
                                    handlers.onUnprocessableEntity ||
                                    typeof handlers.onUnprocessableEntity === 'function'
                                ) {
                                    handlers.onUnprocessableEntity();
                                }
                                break;

                            // Internal Server Error
                            case 500:
                                $.se.ui.notify('เกิดข้อผิดพลาดในการทำงาน กรุณาติดต่อผู้ดูแลระบบของท่าน', 'error');
                                break;
                            default:
                                $.se.ui.notify(
                                    'การเชื่อมต่อกับ Server ล้มเหลว ระบบจะพยายามเชื่อมต่อกับ Server อีกครั้ง \
                                โปรดรอสักครู่หรือกด F5 เพื่อ refresh หน้าจอทันที',
                                    'error'
                                );
                                break;
                        }
                    },
                });
            })(),
        }),
        writable: false,
    });
})();
