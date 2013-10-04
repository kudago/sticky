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
    //returns clean clone
    var badTags = [ "object", "iframe", "embed", "img" ];
    function clone(el) {
        var clone = el.cloneNode(true);
        for (var i = 0; i < badTags.length; i++) {
            var tags = clone.querySelectorAll(badTags[i]);
            for (var j = tags.length; j--; ) {
                tags[j].removeAttribute("src");
                tags[j].removeAttribute("href");
                tags[j].removeAttribute("rel");
                tags[j].removeAttribute("srcdoc");
                if (tags[j].tagName === "SCRIPT") tags[j].parentNode.replaceChild(tags[j]);
            }
        }
        return clone;
    }
    var directions = [ "left", "top", "right", "bottom" ], mimicProperties = [ "padding-", "border-" ];
    //copies size-related style of stub
    function mimicStyle(to, from) {
        var stubStyle = getComputedStyle(from), stubOffset = getBoundingOffsetRect(from), pl = 0, pr = 0, ml = 0;
        if (stubStyle["box-sizing"] !== "border-box") {
            pl = ~~stubStyle.paddingLeft.slice(0, -2);
            pr = ~~stubStyle.paddingRight.slice(0, -2);
        }
        to.style.width = stubOffset.width - pl - pr + "px";
        to.style.left = stubOffset.left + "px";
        to.style.marginLeft = 0;
        for (var i = 0; i < mimicProperties.length; i++) {
            for (var j = 0; j < directions.length; j++) {
                var prop = mimicProperties[i] + directions[j];
                to.style[prop] = stubStyle[prop];
            }
        }
    }
    //checks overlapping widths
    function isOverlap(left, right) {
        var lLeft = left.offsetLeft, lRight = left.offsetLeft + left.offsetWidth, rLeft = right.offsetLeft, rRight = right.offsetWidth + right.offsetLeft;
        if (lRight < rLeft && lLeft < rLeft || lRight > rRight && lLeft > rRight) {
            return false;
        }
        return true;
    }
    var pluginName = "sticky";
    //Sticky - element being sticked at runtime
    function Sticky() {
        this.create.apply(this, arguments);
    }
    //list of instances
    Sticky.list = [];
    //mutually exclusive items
    Sticky.noStack = [];
    //stacks of items
    Sticky.stack = {};
    Sticky.prototype = {
        options: {
            /** @expose */
            offset: 0,
            /** @expose */
            restrictWithin: null,
            //element or bounding box
            /** @expose */
            vAlign: "top",
            /** @expose */
            stickyClass: "is-stuck",
            /** @expose */
            stubClass: "sticky-stub",
            /** @expose */
            stack: null,
            /** @expose */
            collapse: true
        },
        create: function(el, options) {
            if (el.dataset && el.dataset["stickyId"]) {
                return console.log("Sticky already exist");
            }
            this.el = el;
            this.parent = this.el.parentNode;
            //recognize attributes
            this.options = extend({}, this.options, el.dataset, options);
            //query selector
            if (typeof this.options["restrictWithin"] === "string" && this.options["restrictWithin"].trim()) {
                this.restrictWithin = document.body.querySelector(this.options["restrictWithin"]);
            } else {
                this.restrictWithin = this.options["restrictWithin"];
            }
            //keep list
            if (!this.el.dataset) this.el.dataset = {};
            //TODO: move out to polyfill
            this.el.dataset["stickyId"] = Sticky.list.length;
            this.id = Sticky.list.length;
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
            this.parentBox = {
                top: 0,
                height: 0
            };
            //mind gap from bottom & top in addition to restrictBox (for stacks)
            this.offset = {
                top: parseFloat(this.options["offset"]) || 0,
                bottom: 0
            };
            //Detect whether stacking needed
            var prevEl = this.el;
            this.stackId = [];
            this.stack = [];
            if (this.options["stack"]) {
                var stack = this.options["stack"].split(",");
                for (var i = stack.length; i--; ) {
                    stack[i] = stack[i].trim();
                    if (!Sticky.stack[stack[i]]) Sticky.stack[stack[i]] = [];
                    this.stackId[i] = Sticky.stack[stack[i]].length;
                    this.stack.push(stack[i]);
                    Sticky.stack[stack[i]].push(this);
                }
            } else {
                this.stackId[0] = Sticky.noStack.length;
                Sticky.noStack.push(this);
            }
            //stub is a spacer filling space when element is stuck
            this.stub = clone(this.el);
            this.stub.classList.add(this.options["stubClass"]);
            this.stub.style.visibility = "hidden";
            this.stub.style.display = "none";
            this.parent.insertBefore(this.stub, this.el);
            //save initial inline style
            this.initialStyle = this.el.style.cssText;
            this.initialDisplay = getComputedStyle(this.el)["display"];
            //ensure parent's container relative coordinates
            var pStyle = getComputedStyle(this.parent);
            if (pStyle.position == "static") this.parent.style.position = "relative";
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
            //console.log("check:" + this.el.dataset["stickyId"], "isFixed:" + this.isFixed, this.restrictBox)
            if (this.isFixed) {
                if (!this.isTop && vpTop + this.offset.top + this.height + this.mt + this.mb >= this.restrictBox.bottom - this.offset.bottom) {
                    //check bottom parking needed
                    this.parkBottom();
                }
                if (!this.isBottom && vpTop + this.offset.top + this.mt <= this.restrictBox.top) {
                    //check top parking needed
                    this.parkTop();
                }
            } else {
                if (this.isTop || this.isBottom) {
                    if (vpTop + this.offset.top + this.mt > this.restrictBox.top) {
                        //fringe violation from top
                        if (vpTop + this.offset.top + this.height + this.mt + this.mb < this.restrictBox.bottom - this.offset.bottom) {
                            //fringe violation from top or bottom to the sticking zone
                            this.stick();
                        } else if (!this.isBottom) {
                            //fringe violation from top lower than bottom
                            this.stick();
                            this.parkBottom();
                        }
                    } else if (this.isBottom) {
                        //fringe violation from bottom to higher than top
                        this.stick();
                        this.parkTop();
                    }
                }
            }
        },
        //sticking inner routines
        //when park top needed
        parkTop: function() {
            //this.el = this.parent.removeChild(this.el);
            this.el.style.cssText = this.initialStyle;
            this.el.classList.remove(this.options["stickyClass"]);
            //this.stub = this.parent.replaceChild(this.el, this.stub);
            this.stub.style.display = "none";
            this.isFixed = false;
            this.isTop = true;
            this.isBottom = false;
        },
        //to make fixed
        //enhanced replace: faked visual stub is fastly replaced with natural one
        stick: function() {
            //this.el = this.parent.replaceChild(this.stub, this.el);
            this.stub.style.display = this.initialDisplay;
            this.makeStickedStyle(this.el);
            //this.parent.insertBefore(this.el, this.stub);
            this.isFixed = true;
            this.isTop = false;
            this.isBottom = false;
        },
        //when bottom land needed
        parkBottom: function() {
            this.el.classList.remove(this.options["stickyClass"]);
            this.makeParkedBottomStyle(this.el);
            this.isFixed = false;
            this.isBottom = true;
            this.isTop = false;
        },
        //set up style of element as it is parked at the bottom
        makeParkedBottomStyle: function(el) {
            el.style.cssText = this.initialStyle;
            el.style.position = "absolute";
            el.style.top = this.restrictBox.bottom - this.offset.bottom - this.parentBox.top - this.height - this.mt - this.mb + "px";
            mimicStyle(el, this.stub);
            el.style.left = this.stub.offsetLeft + "px";
        },
        makeStickedStyle: function(el, srcEl) {
            el.style.cssText = this.initialStyle;
            el.style.position = "fixed";
            el.style.top = this.offset.top + "px";
            el.classList.add(this.options["stickyClass"]);
            mimicStyle(el, srcEl || this.stub);
        },
        //count offset borders, container sizes. Detect needed container size
        recalc: function() {
            //console.group("recalc:" + this.el.dataset["stickyId"])
            var measureEl = this.isTop ? this.el : this.stub;
            //update parent container size & offsets
            this.parentBox = getBoundingOffsetRect(this.parent);
            //update self size & position
            this.height = measureEl.offsetHeight;
            var mStyle = getComputedStyle(measureEl);
            this.ml = ~~mStyle.marginLeft.slice(0, -2);
            this.mr = ~~mStyle.marginRight.slice(0, -2);
            this.mt = ~~mStyle.marginTop.slice(0, -2);
            this.mb = ~~mStyle.marginBottom.slice(0, -2);
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
                this.restrictBox.bottom = this.parentBox.height + this.parentBox.top;
            }
            //make restriction up to next sibling within one container
            this.offset.bottom = 0;
            this.offset.top = 0;
            var prevSticky;
            if (this.stack.length) {
                for (var i = this.stack.length; i--; ) {
                    if (prevSticky = Sticky.stack[this.stack[i]][this.stackId[i] - 1]) {
                        //make offsets for stacked mode
                        var prevMeasurer = prevSticky.isTop ? prevSticky.el : prevSticky.stub;
                        this.offset.top = prevSticky.offset.top;
                        if (!(this.options["collapse"] && !isOverlap(measureEl, prevMeasurer))) {
                            this.offset.top += prevSticky.height + Math.max(prevSticky.mt, prevSticky.mb);
                            //collapsed margin
                            var nextSticky = Sticky.stack[this.stack[i]][this.stackId[i]];
                            //multistacking-way of correcting bottom offsets
                            for (var j = this.stackId[i] - 1; prevSticky = Sticky.stack[this.stack[i]][j]; j--) {
                                prevSticky.offset.bottom = Math.max(prevSticky.offset.bottom, nextSticky.offset.bottom + nextSticky.height + nextSticky.mt + nextSticky.mb);
                                nextSticky = prevSticky;
                            }
                        }
                    }
                }
            } else if (prevSticky = Sticky.noStack[this.stackId[0] - 1]) {
                prevSticky.restrictBox.bottom = this.restrictBox.top - this.mt;
            }
            clearTimeout(this._updTimeout);
            this._updTimeout = setTimeout(this.adjustSizeAndPosition, 0);
        },
        adjustSizeAndPosition: function() {
            if (this.isTop) {
                this.el.style.cssText = this.initialStyle;
            } else if (this.isBottom) {
                this.makeParkedBottomStyle(this.el);
            } else {
                this.makeStickedStyle(this.el);
            }
            this.check();
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
    } else {
        window["Sticky"] = Sticky;
    }
})(window["jQuery"] || window["Zepto"]);