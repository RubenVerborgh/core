/**
 * @file Container class for shower slides.
 */
modules.define('shower.Container', [
    'Emitter',
    'util.bind',
    'util.extend'
], function (provide, EventEmitter, bind, extend) {
    /**
     * @typedef {object} HTMLElement
     */

    /**
     * @class
     * @name shower.Container
     *
     * Container class for shower slides. Contains DOM,
     * enter & exit slide mode.
     *
     * @param {Shower} shower Shower.
     * @param {HTMLElement} containerElement Container element.
     */
    function Container(shower, containerElement) {
        this.events = new EventEmitter();
        this.options = shower.options.container || {};

        this._shower = shower;
        this._element = containerElement;
        this._isSlideMode = false;

        this.init();
    }

    extend(Container.prototype, /** @lends shower.Container.prototype */{

        init: function () {
            var bodyClassList = document.body.classList;
            var mode = this.options.mode;

            if (!bodyClassList.contains(mode.list) &&
                !bodyClassList.contains(mode.full)) {
                bodyClassList.add(mode.list);
            }

            this._setupListeners();
        },

        destroy: function () {
            this._clearListeners();
            this._element = null;
            this._shower = null;
            this._isSlideMode = null;
        },

        /**
         * @returns {HTMLElement} Container element.
         */
        getElement: function () {
            return this._element;
        },

        /**
         * Enter slide mode.
         * Slide fills the maximum area.
         *
         * @returns {shower.Container}
         */
        enterSlideMode: function () {
            var bodyClassList = document.body.classList;
            var mode = this.options.mode;

            bodyClassList.remove(mode.list);
            bodyClassList.add(mode.full);

            this._applyTransform(this._getTransformScale());

            if (!this._isSlideMode) {
                this._isSlideMode = true;
            }

            this._isSlideMode = true;
            this.events.emit('slidemodeenter');

            return this;
        },

        /**
         * Exit slide mode.
         * Shower returns into list mode.
         *
         * @returns {shower.Container}
         */
        exitSlideMode: function () {
            var elementClassList = document.body.classList;
            var mode = this.options.mode;

            elementClassList.remove(mode.full);
            elementClassList.add(mode.list);

            this._applyTransform('none');

            if (this._isSlideMode) {
                this._isSlideMode = false;
                this.scrollToSlide(this._shower.player.getCurrentSlideIndex());
            }

            this._isSlideMode = false;
            this.events.emit('slidemodeexit');

            return this;
        },

        /**
         * Return state of slide mode.
         *
         * @returns {Boolean} Slide mode state.
         */
        isSlideMode: function () {
            return this._isSlideMode;
        },

        /**
         * Scroll to slide by index.
         *
         * @param {Number} slideIndex
         * @returns {shower.Container}
         */
        scrollToSlide: function (slideIndex) {
            var slide = this._shower.get(slideIndex);
            var slideElement;

            if (!slide) {
                throw new Error('There is no slide with index ' + slideIndex);
            }

            slideElement = slide.getLayout().getElement();
            window.scrollTo(0, slideElement.offsetTop);

            return this;
        },

        _setupListeners: function () {
            this._showerListeners = this._shower.events.group()
                .on('slideadd', this._onSlideAdd, this)
                .on('slideremove', this._onSlideRemove, this);

            this._shower.ready(bind(this._onShowerReady, this));

            window.addEventListener('resize', bind(this._onResize, this));
            document.addEventListener('keydown', bind(this._onKeyDown, this));
        },

        _onShowerReady: function () {
            this._playerListeners = this._shower.player.events.group()
                .on('activate', this._onSlideActivate, this);
        },

        _clearListeners: function () {
            this._showerListeners.offAll();

            if (this._playerListeners) {
                this._playerListeners.offAll();
            }

            window.removeEventListener('resize', bind(this._onResize, this));
            document.removeEventListener('keydown', bind(this._onKeyDown, this));
        },

        _getTransformScale: function () {
            var denominator = Math.max(
                document.body.clientWidth / window.innerWidth,
                document.body.clientHeight / window.innerHeight
            );

            return 'scale(' + (1 / denominator) + ')';
        },

        _applyTransform: function (transformValue) {
            [
                'WebkitTransform',
                'MozTransform',
                'msTransform',
                'OTransform',
                'transform'
            ].forEach(function (property) {
                document.body.style[property] = transformValue;
            });
        },

        _onResize: function () {
            if (this.isSlideMode()) {
                this._applyTransform(this._getTransformScale());
            }
        },

        _onSlideAdd: function (e) {
            var slide = e.get('slide');
            slide.events
                .on('click', this._onSlideClick, this);
        },

        _onSlideRemove: function (e) {
            var slide = e.get('slide');
            slide.events
                .off('click', this._onSlideClick, this);
        },

        _onSlideClick: function () {
            if (!this._isSlideMode) {
                this.enterSlideMode();
            }
        },

        _onSlideActivate: function (e) {
            var slide = e.get('slide');
            this.scrollToSlide(slide.state.index);
        },

        _onKeyDown: function (e) {
            if (!this._shower.isHotkeysEnabled()) {
                return;
            }

            switch (e.which) {
                case 13: // enter
                    e.preventDefault();
                    this.enterSlideMode();
                    break;

                case 27: // esc
                    e.preventDefault();
                    this.exitSlideMode();
                    break;

                case 116: // F5 (Shift)
                    e.preventDefault();
                    if (!this.isSlideMode()) {
                        var slideNumber = e.shiftKey ? this._shower.player.getCurrentSlideIndex() : 0;
                        this._shower.go(slideNumber);
                        this.enterSlideMode();
                    } else {
                        this.exitSlideMode();
                    }

                    break;

                case 80: // P Alt Cmd
                    if (!this.isSlideMode() && e.altKey && e.metaKey) {
                        e.preventDefault();
                        this.enterSlideMode();
                    }
                    break;
            }
        }
    });

    provide(Container);
});
