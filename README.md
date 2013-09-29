# Sticky.js

Full-featured [sticky-kit.js](https://github.com/leafo/sticky-kit) / [sticky.js](https://github.com/garand/sticky) with extra features:

* Sticky modes: stacked/mutually exclusive.
* Any restricting containers possible, not only parent ones.
* Do not require jquery dependency. Work regardless of jquery.
* Extremely enhanced performance, browser repaints reduced to minimum.
* Careful treating of sizes with different initial position modes: absolute, relative, floated and others.

## Use

```js
//jQuery way
$(".sticky-element").sticky({/*options*/});

//no-jQuery way
var sticky = new Sticky(document.querySelector(".sticky-element"), {/* options */});
```

## Options

```js
{
	offset: 0, //how much pixels to mind from the top
	restrictWithin: parent, //any element (no-jquery), element selector or bounding box like {top: 0, bottom: 100}
	vAlign: 'top', //TODO
	stickyClass: "is-stuck", //class to add when element is sticked
	stubClass: "sticky-stub", //class to add to the spacer
	mode: Sticky.MODE.MUTUALLY_EXCLUSIVE //one of Sticky.MODE's: NONE, STACKED, MUTUALLY_EXCLUSIVE
}
```

## API

```js
//jQuery way
$(document).trigger("sticky:recalc");

//no-jQuery way
document.dispatchEvent(new CustomEvent("sticky:recalc"));
```

Beware that not every browser supports `dispatchEvent` method. In order to make IE < 10 work, use one of the polyfills: [polyfill combinator](https://github.com/jonathantneal/polyfill), [modernizr](https://github.com/Modernizr/Modernizr) or [ES5 shim](https://github.com/termi/ES5-DOM-SHIM).