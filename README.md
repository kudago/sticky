# Sticky.js

Full-featured [sticky-kit.js](https://github.com/leafo/sticky-kit)/[sticky.js](https://github.com/garand/sticky) with extra features:

* Sticky modes: stacked/mutually exclusive.
* Any restricting containers possible, not only parent ones.
* Devoided jquery dependency. Work without jquery as well.
* Extremely enhanced performance, browser repaints reduced to minimum.
* Careful treating of sizes with different initial position modes: absolute, relative, floated and others.

## Use

```js
//jQuery way
$(".sticky-element").sticky({ /*options*/ });

//No-jQuery way
var sticky = new Sticky(document.querySelector(".sticky-element"), { /* options */});
```

## Options

```js
{
	offset: 0, //how much pixels to mind from the top
	restrictWithin: parent, //any element or bounding box ({top: 0, bottom: 100})
	vAlign: 'top', //TODO
	stickyClass: "is-stuck",
	stubClass: "sticky-stub",
	mode: Sticky.MODE.MUTUALLY_EXCLUSIVE //one of `Sticky.MODE`s: 0 - none, 1 - stacked, 2 - mutually exclusive
}
```