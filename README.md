# Sticky.js

Carefully makes sticky elements. Sticky elements - ones become fixed being scrolled on.
Supports all features of [sticky-kit.js](https://github.com/leafo/sticky-kit) and [sticky.js](https://github.com/garand/sticky), but 
implements corre

* Sticky modes: stacked/mutually exclusive.
* Any restricting containers possible, not only parent ones.
* No jquery dependency. Work regardless of jquery presence, but if it is, injects jquery plugin.
* Extremely enhanced performance, browser repaintings reduced to minimum (one per stick/unstick action).
* Careful treatment of element's style, like absolute/relative position, floating etc.
* Keep correct work on resizing.

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