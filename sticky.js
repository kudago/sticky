(function($) {
    /*----------------Utils*/
    function extend(a) {
        for (var i = 1, l = arguments.length; i < l; i++) {
            var b = arguments[i];
            for (var k in b) {
                a[k] = b[k];
            }
        }
        return a;
    }
    function getBoundingOffsetRect(el) {
        var c = {
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: 0,
            height: 0
        }, rect = el.getBoundingClientRect();
        c.top = rect.top + (window.pageYOffset || document.documentElement.scrollTop);
        c.left = rect.left + (window.pageXOffset || document.documentElement.scrollLeft);
        c.width = el.offsetWidth;
        c.height = el.offsetHeight;
        c.right = document.width - rect.right;
        c.bottom = window.innerHeight + (window.pageYOffset || document.documentElement.scrollTop) - rect.bottom;
        return c;
    }
    var pluginName = "sticky";
    //Sticky - element being sticked at runtime
    function Sticky() {
        this.create.apply(this, arguments);
    }
    //list of instances
    Sticky.list = [];
    Sticky.prototype = {
        options: {
            offset: 0,
            restrictWithin: null,
            //element or bounding box
            vAlign: "top",
            stickyClass: "is-stuck",
            stubClass: "sticky-stub",
            mode: "stacked"
        },
        create: function(el, options) {
            this.el = el;
            //recognize attributes
            this.options = extend({}, this.options, el.dataset, options);
            //query selector
            if (typeof this.options["restrictWithin"] === "string") {
                this.restrictWithin = document.body.querySelector(this.options["restrictWithin"]);
            } else {
                this.restrictWithin = this.options["restrictWithin"];
            }
            //cast offset type
            this.options.offset = parseFloat(this.options.offset) || 0;
            //keep list
            this.el.stickyId = Sticky.list.length;
            Sticky.list.push(this);
            //init vars
            this.isFixed = false;
            this.isBottom = false;
            this.isTop = true;
            this.restrictBox = {
                top: 0,
                bottom: 9999
            };
            //self position & size
            this.height = 0;
            //parent position & size
            this.parent = {
                top: 0,
                height: 0
            };
            //Find stickies siblings within the container
            var prevEl = this.el;
            while ((prevEl = prevEl.previousSibling) !== null) {
                if (prevEl.stickyId !== undefined) {
                    this.prevSticky = Sticky.list[prevEl.stickyId];
                    this.prevSticky.nextSticky = this;
                    //console.log("found " + prevEl.stickyId)
                    break;
                }
            }
            //stub is a spacer filling space when element is stuck
            this.stub = this.el.cloneNode(true);
            this.stub.classList.add(this.options.stubClass);
            this.stub.style.visibility = "hidden";
            //save initial inline style
            this.initialStyle = this.el.style.cssText;
            //visual stub needed for smooth rendering of switch
            this.stub2 = this.el.cloneNode(true);
            //fast replacer
            this.stubs = document.createDocumentFragment();
            //ensure parent's container relative coordinates
            var pStyle = window.getComputedStyle(this.el.parentNode);
            if (pStyle.position == "static") this.el.parentNode.style.position = "relative";
            //bind methods
            this.check = this.check.bind(this);
            this.recalc = this.recalc.bind(this);
            this.adjustSizeAndPosition = this.adjustSizeAndPosition.bind(this);
            this.recalc();
            //bind events
            document.addEventListener("scroll", this.check);
            window.addEventListener("resize", this.recalc);
            //API events
            document.addEventListener("sticky:recalc", this.recalc);
        },
        //changing state necessity checker
        check: function() {
            var vpTop = window.pageYOffset || document.documentElement.scrollTop;
            //console.log("check:" + this.el.stickyId, "isFixed:" + this.isFixed, this.restrictBox)
            if (this.isFixed) {
                if (!this.isTop && vpTop + this.options.offset + this.height >= this.restrictBox.bottom) {
                    //check bottom parking needed
                    this.parkBottom();
                }
                if (!this.isBottom && vpTop + this.options.offset <= this.restrictBox.top) {
                    //check top parking needed
                    this.parkTop();
                }
            } else {
                if ((this.isTop || this.isBottom) && vpTop + this.options.offset > this.restrictBox.top) {
                    //fringe violation from top
                    if (vpTop + this.options.offset + this.height < this.restrictBox.bottom) {
                        //fringe violation from top to the sticking zone
                        this.stick();
                    } else if (!this.isBottom) {
                        //fringe violation from top lower than bottom
                        this.stick();
                        this.parkBottom();
                    }
                }
            }
        },
        //sticking inner routines
        //when park top needed
        parkTop: function() {
            this.stub = this.el.parentNode.removeChild(this.stub);
            this.clearMimicStyle();
            this.el.classList.remove(this.options.stickyClass);
            this.isFixed = false;
            this.isTop = true;
            this.isBottom = false;
        },
        //to make fixed
        //enhanced replace: faked visual stub is fastly replaced with natural one
        stick: function() {
            if (!this.isBottom) {
                //if violating from the top
                this.prepareStubs(this.stub, this.stub2);
            } else {
                //if violating from the bottom
                this.prepareStubs(this.stub2);
            }
            this.makeStickedStyle(this.stub2, this.el);
            this.el = this.el.parentNode.replaceChild(this.stubs, this.el);
            this.makeStickedStyle(this.el);
            this.stub2 = this.stub.parentNode.replaceChild(this.el, this.stub2);
            this.isFixed = true;
            this.isTop = false;
            this.isBottom = false;
        },
        //when bottom land needed
        parkBottom: function() {
            this.el.classList.remove(this.options.stickyClass);
            this.makeParkedBottomStyle(this.el);
            this.isFixed = false;
            this.isBottom = true;
            this.isTop = false;
        },
        //set up style of element as it is parked at the bottom
        makeParkedBottomStyle: function(el) {
            el.style.cssText = "";
            el.style.position = "absolute";
            el.style.top = this.restrictBox.bottom - this.parent.top - this.height + "px";
            this.mimicStyle(el, this.stub);
            el.style.left = this.stub.offsetLeft + "px";
        },
        makeStickedStyle: function(el, srcEl) {
            el.style.cssText = "";
            el.style.position = "fixed";
            el.style.top = this.options.offset + "px";
            el.classList.add(this.options.stickyClass);
            this.mimicStyle(el, srcEl || this.stub);
        },
        //Stuff stubs fragment
        prepareStubs: function() {
            for (var i = 0; i < arguments.length; i++) {
                this.stubs.appendChild(arguments[i]);
            }
        },
        //count offset borders, container sizes. Detect needed container size
        recalc: function() {
            //console.group("recalc:" + this.el.stickyId)
            var measureEl = this.isTop ? this.el : this.stub;
            //update parent container size & offsets
            this.parent = getBoundingOffsetRect(measureEl.parentNode);
            //update self size & position
            this.height = measureEl.offsetHeight;
            //update restrictions
            if (this.restrictWithin instanceof Element) {
                var offsetRect = getBoundingOffsetRect(this.restrictWithin);
                this.restrictBox.top = Math.max(offsetRect.top, getBoundingOffsetRect(measureEl).top);
                //console.log(getBoundingOffsetRect(this.stub))
                this.restrictBox.bottom = this.restrictWithin.offsetHeight + offsetRect.top;
            } else if (this.restrictWithin instanceof Object) {
                this.restrictBox = this.restrictWithin;
            } else {
                //case of parent container
                this.restrictBox.top = getBoundingOffsetRect(measureEl).top;
                this.restrictBox.bottom = this.parent.height + this.parent.top;
            }
            //make restriction up to next sibling within one container
            if (this.prevSticky && this.options.mode === "exclusive") {
                this.prevSticky.restrictBox.bottom = this.restrictBox.top;
            }
            //make offsets for stacked mode
            if (this.prevSticky && this.options.mode === "stacked") {
                var prevMeasurer = this.prevSticky.isTop ? this.prevSticky.el : this.prevSticky.stub;
                this.options.offset = this.prevSticky.options.offset + prevMeasurer.offsetHeight;
                var prevEl = this;
                while (prevEl = prevEl.prevSticky) {
                    prevEl.restrictBox.bottom -= this.height;
                }
            }
            clearTimeout(this._updTimeout);
            this._updTimeout = setTimeout(this.adjustSizeAndPosition, 0);
        },
        adjustSizeAndPosition: function() {
            if (this.isTop) {
                this.clearMimicStyle();
            } else if (this.isBottom) {
                this.makeParkedBottomStyle(this.el);
            } else {
                this.makeStickedStyle(this.el);
            }
            this.check();
        },
        _directions: [ "left", "top", "right", "bottom" ],
        _mimicProperties: [ "padding-", "border-" ],
        mimicStyle: function(to, from) {
            var stubStyle = getComputedStyle(from), stubOffset = getBoundingOffsetRect(from);
            to.style.width = stubOffset.width + "px";
            to.style.left = stubOffset.left + "px";
            for (var i = 0; i < this._mimicProperties.length; i++) {
                for (var j = 0; j < this._directions.length; j++) {
                    var prop = this._mimicProperties[i] + this._directions[j];
                    to.style[prop] = stubStyle[prop];
                }
            }
        },
        clearMimicStyle: function() {
            this.el.style.cssText = this.initialStyle;
        }
    };
    //jquery-plugin
    if ($) {
        $["fn"][pluginName] = function(arg) {
            return this["each"](function(i, e) {
                var $e = $(e);
                var instance = new Sticky($e[0], arg);
                $e.data(pluginName, instance);
            });
        };
    }
})(window["jQuery"] || window["Zepto"]);