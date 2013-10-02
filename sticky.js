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
        var stubStyle = getComputedStyle(from), stubOffset = getBoundingOffsetRect(from), pl = 0, pr = 0;
        if (stubStyle["box-sizing"] !== "border-box") {
            pl = ~~stubStyle.paddingLeft.slice(0, -2);
            pr = ~~stubStyle.paddingRight.slice(0, -2);
        }
        to.style.width = stubOffset.width - pl - pr + "px";
        to.style.left = stubOffset.left + "px";
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
    Sticky.prototype = {
        /** @expose */
        options: {
            offset: 0,
            restrictWithin: null,
            //element or bounding box
            vAlign: "top",
            stickyClass: "is-stuck",
            stubClass: "sticky-stub",
            mode: "stacked",
            collapseStacked: true,
            prevSticky: null
        },
        create: function(el, options) {
            if (el.dataset["stickyId"]) {
                return console.log("Sticky already exist");
            }
            this.el = el;
            this.parent = this.el.parentNode;
            //recognize attributes
            this.options = extend({}, this.options, el.dataset, options);
            //query selector
            if (typeof this.options["restrictWithin"] === "string") {
                this.restrictWithin = document.body.querySelector(this.options["restrictWithin"]);
            } else {
                this.restrictWithin = this.options["restrictWithin"];
            }
            //cast offset type
            this.options["offset"] = parseFloat(this.options["offset"]) || 0;
            //keep list
            this.el.dataset["stickyId"] = Sticky.list.length;
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
            //Find stickies siblings within the container
            var prevEl = this.el;
            if (this.options["prevSticky"]) {
                var prevStickyEl = typeof this.options["prevSticky"] === "string" ? document.querySelector(this.options["prevSticky"]) : this.options["prevSticky"];
                if (prevStickyEl.dataset["stickyId"] && Sticky.list[prevStickyEl.dataset["stickyId"]]) {
                    this.prevSticky = Sticky.list[prevStickyEl.dataset["stickyId"]];
                    this.prevSticky.nextSticky = this;
                } else {}
            } else {
                //find prev stickies between preceding siblings
                while ((prevEl = prevEl.previousSibling) !== null) {
                    if (prevEl.nodeType === 1 && prevEl.dataset["stickyId"] !== undefined) {
                        this.prevSticky = Sticky.list[prevEl.dataset["stickyId"]];
                        this.prevSticky.nextSticky = this;
                        //console.log("found " + prevEl.dataset["stickyId"])
                        break;
                    }
                }
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
            var pStyle = window.getComputedStyle(this.parent);
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
                if (!this.isTop && vpTop + this.options["offset"] + this.height >= this.restrictBox.bottom) {
                    //check bottom parking needed
                    this.parkBottom();
                }
                if (!this.isBottom && vpTop + this.options["offset"] <= this.restrictBox.top) {
                    //check top parking needed
                    this.parkTop();
                }
            } else {
                if ((this.isTop || this.isBottom) && vpTop + this.options["offset"] > this.restrictBox.top) {
                    //fringe violation from top
                    if (vpTop + this.options["offset"] + this.height < this.restrictBox.bottom) {
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
            el.style.top = this.restrictBox.bottom - this.parentBox.top - this.height + "px";
            mimicStyle(el, this.stub);
            el.style.left = this.stub.offsetLeft + "px";
        },
        makeStickedStyle: function(el, srcEl) {
            el.style.cssText = this.initialStyle;
            el.style.position = "fixed";
            el.style.top = this.options["offset"] + "px";
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
            if (this.prevSticky) {
                if (this.options["mode"] === "exclusive") {
                    this.prevSticky.restrictBox.bottom = this.restrictBox.top;
                } else if (this.options["mode"] === "stacked") {
                    //make offsets for stacked mode
                    var prevMeasurer = this.prevSticky.isTop ? this.prevSticky.el : this.prevSticky.stub;
                    if (this.options["collapseStacked"] && !isOverlap(measureEl, prevMeasurer)) {
                        this.options["offset"] = this.prevSticky.options["offset"];
                    } else {
                        this.options["offset"] = this.prevSticky.options["offset"] + prevMeasurer.offsetHeight;
                        var prevEl = this;
                        while (prevEl = prevEl.prevSticky) {
                            prevEl.restrictBox.bottom -= this.height;
                        }
                    }
                }
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