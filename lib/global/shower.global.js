shower.modules.define('shower.global', [
    'Emitter',
    'Plugins'
], function (provide, EventEmitter, Plugins) {

    var inited = [];

    /**
     * @class
     * @name shower
     * @static
     */
    var sh = {
        /**
         * Ready function will call callback when Shower init.
         * If Shower already initialized, callback will call immediately.
         *
         * @param {function} [callback] Your function that run after Shower initialized.
         * It will be call with shower.
         * @returns {boolean} Ready state.
         *
         * @example
         * shower.ready(function (sh) {
         *     sh.go(2);
         * });
         */
        ready: function (callback) {
            if (callback) {
                if (inited.length) {
                    inited.forEach(callback);
                } else {
                    this.events.once('init', function (e) {
                        callback(e.get('shower'));
                    });
                }
            }

            return Boolean(inited.length);
        },

        /**
         * Init new Shower.
         * @param {object} [initOptions]
         * @param {(HTMLElement|string)} [initOptions.container='.shower']
         * @param {object} [initOptions.options]
         * @param {function} [initOptions.callback]
         * @param {object} [initOptions.context]
         *
         * @example
         * shower.init({
         *     contaner: '.my-shower',
         *     callback: this._onShowerInit,
         *     context: this
         * });
         */
        init: function (initOptions) {
            initOptions = initOptions || {};

            shower.modules.require(['Shower'], function (Shower) {
                var showerInstance = new Shower(initOptions.container, initOptions.options);
                if (initOptions.callback) {
                    initOptions.callback.call(initOptions.context, showerInstance);
                }
            });
        },

        /**
         * @returns {Shower[]} Array of shower players.
         */
        getInited: function () {
            return inited;
        }
    };

    /**
     * @name shower.plugins
     * @field
     * @type {Plugins}
     */
    sh.events = new EventEmitter({context: sh});

    /**
     * @name shower.events
     * @field
     * @type {Emitter}
     */
    sh.plugins = new Plugins(sh);

    sh.events.on('notify', function (e) {
        var showerInstance = e.get('shower');
        inited.push(showerInstance);
        sh.events.emit('init', e);
    });

    provide(sh);
});
