---
title: React and Svelte Vibes
description: Two UI Libraries that have different vibes. Which one is your vibe?
pubDate: 2025-01-18
author: Kresna Satya
draft: false
---

This post is about when did I know React and Svelte, vibes between React and Svelte, and why I prefer Svelte over React.

## Birth of React

I know React when I was in the last semester in university around 2015 and 2016. I saw the Indonesia community posts from Riza Fahmi who works for Hacktiv8 and Sonny Lazuardi who works for Sales Stock at that time.

If I'm not wrong see the posts, Riza was thinking that React is the future of JQuery and give some showcases. Meanwhile, Sonny gives showcase about React Native, a way to develop and build mobile app using React and the Sales Stock is the result of React Native.

Also at that time, when you create a React component, you need to write it in class based approach instead of functional approach.

::: code-group labels=[react_2015.js, react_2016.js]

```js
const Button = React.createClass({
    state: {
        count: 1
    },
});

handleClick(event) {
    console.log('clicked');
    this.setState({ count: this.state.count + 1 });
},

render() {
    return (
        <button onClick={this.handleClick}>
            {this.props.children}
        </button>
    )
}
```

```js
class Button extends React.component {
    state = {
        count: 1
    };

    handleClick = () => {
        console.log('clicked');
        this.setState({ count: this.state.count + 1 });
    };
}
```

:::

One year ago, I purchased a great interactive course called [Joy of React](https://www.joyofreact.com). This course created by Josh Comeau who worked for Khan Academy and Digital Ocean. He has a great teaching skill that I cannot resist to purchased his course. Another reason is that the React is still the great demand for job opportunity until this day... 

> Yeah, until this day. 

Luckily, the course have purcased parity program so I can buy the course with safety budget.

In first chapter of this course, Josh tells why React born. Here's the quote.

> *In the early 2010s, Facebook developers had a problem. Thousands of people were complaining about "phantom messages".*

> Users would see a little 1 notification badge by the "messages" icon, suggesting they had new messages. But when they'd click it, there wouldn't be anything new, just the same old messages.

> At the time, the UI had 3 separate locations where message state was presented: Message Drawer, Chat Widget, and Main View.

![Picture of Facebook UI Chat Phantom Messages](../images/facebook-phantom-message.png)

> Users were getting phantom messages because these 3 parts of the UI were powered by separate views, and those views were getting out of sync.

> This might seem like a trivial problem to solve, but Facebook is a tremendously complex app, with hundreds of developers across dozens of teams all collaborating, adding new features, moving fast and breaking things. Every week, some new edge-case would crop up, leading to phantom messages. It was like playing whack-a-mole; every time they fixed a bug, a new one would pop up.

> The team eventually solved this problem by migrating to an experimental new internal tool: React. This problem, along with so many others, disappeared.

Please watch the [**Rethinking Web App Development at Facebook** presented by Jing Cheng](https://www.youtube.com/watch?v=nYkdrAPrdcw&t=624s).

Few months ago before I purchased Joy of React course, I saw a tweet from ex Meta engineer.
This tweet about Facebook Chat problem and is quite relate with the previous qoute. Here's the qoute.

> I worked on Facebook Chat for several years, both on the front end and the infrastructure.

> Before the major effort to redo the UI, FB Chat was super broken and we had no idea why.

> We got tons of bug reports about Chat being broken every day, but we noticed an odd pattern in the data: the volume of reports didn't match the volume of usage. It was time-shifted from the peaks we'd see in the US.

> We didn't know what was wrong, but we knew the code was a mess.

> We set about rewriting both the front-end and the back-end in an effort to fix it.

> The front-end rewrite pulled in a whole team of amazing engineers and became one of the big threads that led to 
ReactJS

> In the public eye, we portrayed this project as the one that ultimately fixed Chat.

> And the way I've usually told it, fixing Facebook Chat and the birth of React are the same story.

> But no framework was going to fix the worst problem with Chat.

> During the time we were working on the Chat rewrite, we were also replacing the original Erlang backend with one written in C++.

> This was probably a good move, but the problem wasn't with Erlang either.

> Our initial spec for the new backend didn't say much about observability, but it was an important feature, and the rewrite forced us to rebuild it.

> Little did we know this would lead us to the root cause of our problems…

> When we finally gained insight into our deliverability data, we were able to cut it by region.

> We noticed Chat was really popular in India. This was before WhatsApp, at a time when SMS wasn't reliable.

> Eventually we pinpointed a region in India where one specific DNS provider was giving out the wrong IP addresses for our Chat servers.

> So when people went to use Chat, they would sometimes get a notification that they had a message, and then it would disappear.

> Or they'd send a message and it would get lost. All because they were connecting to the wrong IP address.

> That was it!

> None of the sexy new tech we were working on was going to solve that problem.

> Ever.

> Instead, **the solution was to build observability that allowed us to track end-to-end message delivery.**

For full tweet, please see [Adam Wolff's tweet about behind the story of FB Chat and ReactJS](https://x.com/dmwlff/status/1762885255030259854).

After I read his tweet, I'm muttering:

> If Facebook fix the DNS problem earlier, I think ReactJS will not exist and JQuery is still the king!

> Or maybe ReactJS still exist but will simpler learning curve instead of steeper learning curve.

Well, I just muttering and I can be wrong. But, the things I learn is that **build observability is the key to to track end-to-end message delivery in Facebook Chat.**

Also, I think [we should respect React](/posts/give-a-space-for-reactjs) because of them, many frameworks born with better ideas like Svelte with compiler approach and Solid with signal approach.

## Birth of Svelte

The first time I know Svelte is when I watched Rich Harris's presentation around 2019. At that time he presents rethinking reactivity and Svelte 3 is the result of it.
Until this day, I'm amazed with his speaking to promote his ideas. The thing that I really like in Svelte is when you want to change the value use operator instead of function or dot notation of object.

![Picture of Operator in Svelte 3](../images/operator-in-svelte-3.jpg)

![Picture of Change value in Svelte 5](../images/change-value-in-svelte-5.jpg)

The question is why Svelte can achieve this approach but other doesn't?

Actually, [Svelte is a programming language](https://gist.github.com/Rich-Harris/0f910048478c2a6505d1c32185b61934) that compile into tightly-optimized vanilla JavaScript.

Here's the output when we declare and update value in Svelte way.

::: code-group labels=[Svelte, Compiled Svelte]

```html
<script>
    // Normal-ass values
    let count = $state(0);
    count += 1;
    console.log({ count });
</script>
```

```js
// Compile output
let count = $.state(0);

$.set(count, $.get(count) + 1);
console.log({ count: $.get(count) });
```

:::

The syntax above is Svelte 5 which is the upgrade version of Svelte 3 and 4. In Svelte 3 and 4 there are some syntaxes that I dislike and luckily changed into Svelte 5.

- `$:` for derived/effect. In Svelte 5 it turns out to be `$derived` and `$effect`.
- `export let` for passing properties into component. In Svelte 5 it turns out to be `$props`.
- Event listener like `on:click` changed into `onclick` in Svelte 5 which is it's a nature of HTML attribute.

If you have try React before and now try Svelte 5, you will feel that how easier it is to built a component or web app just with fundamental of HTML, CSS, and JavaScript. That's it.

Also, why Rich Harris make Svelte like this? Because he works as visual journalism programmer.

In journalism world, you have a tight deadline, you need to [build and deliver rich interactive application as soon as possible](https://www.youtube.com/watch?v=uMyvt9KfpFk). By using Svelte, this means that you just need tools that by syntax is your own home or nature
as web programmer like HTML, CSS, and Javascript without any steep learning curve like ReactJS.

## Vibes

Let's talk about vibes. The vibes I mean is how I feel when I do web programming using React and Svelte.

First, let's see the [definition of Vibes according to Merriam-Webster](https://www.merriam-webster.com/dictionary/vibe).

> *"A distinctive feeling or quality capable of being sensed"*

E.g.

This place has a good/bad vibe.

She gave me a weird vibe. = She gave off a weird vibe. = I got a weird vibe from her.

### State + Create a Component

I would like to think that State is a thing that can be change frequently regarding of user actions. Also, I would like to think State is a Model, a part of MVC or MVVM, etc. Let's see how to declare state in React and Svelte by visit project called [Floating](https://github.com/senkulabs/floating-coin-react) [Coin](https://github.com/senkulabs/floating-coin-svelte).

::: code-group labels=[React, Svelte]

```js
import { useState } from 'react'
import './Coin.css'

function App() {
  const [numOfCoins, setNumOfCoins] = useState(0)

  return (
    <div className="wrapper">
      <main>
        <div className="coin-wrapper">
          <button className="coin" onClick={() => setNumOfCoins(numOfCoins + 2)}>
            <span className="visually-hidden">Add 2 coin</span>
            <img className="coin-image" alt="" src="https://sandpack-bundler.vercel.app/img/toonie.png" />
          </button>
        </div>
      </main>
      <footer>
        Your coin balance:
        <strong>{numOfCoins}</strong>
      </footer>
    </div>
  )
}

export default App
```

```html
<script>
  import './Coin.css';

  let numOfCoins = $state(0);
</script>

<div class="wrapper">
  <main>
    <div class="coin-wrapper">
      <button class="coin" onclick={() => numOfCoins += 2}>
        <span class="visually-hidden">Add 2 coin</span>
        <img class="coin-image" alt="" src="https://sandpack-bundler.vercel.app/img/toonie.png" />
      </button>
    </div>
  </main>
  <footer>
    Your coin balance:
    <strong>{numOfCoins}</strong>
  </footer>
</div>
```

:::

1. To create state in React, we use function called `useState()` which import from `react`. To create state in Svelte, we use a rune called `$state()`. You don't need to import anything for `$state` because it's a part of Svelte language. _Rune is a letter or mark used as a mystical or magic symbol._

2. When you click the coin, the value change from 0 to increment by 2. In React, to change that value, you need to call `setNumOfCoins` function like this `setNumCoins(numOfCoins + 2)`. In Svelte, to change that value you just use operator like this `numOfCoins += 2` or `numOfCoins = numOfCoins + 2`. 

3. To create component in React today, you use functional approach with JSX syntax. JSX looks like you write HTML in JavaScript. So the attribute like `class` and `onclick` that a part of HTML change into `className` and `onClick`. In my observation, we cannot write `class` as a part of HTML attribute for styling CSS in React because it will get a conflict with the `class` keyword of JavaScript.

4. To create component in Svelte, you use HTML, a mother language of web. The attribute like `class` and `onclick` in Svelte still same in HTML. Thanks to compiler.

### Separate Component + Principle of Least Privilege

Let's refactor the Coin component by split it from the `App` component.

First, let's see the React part.

::: code-group labels=[App.jsx, Coin.jsx]

```js
import { useState } from 'react'
import Coin from './Coin'

function App() {
  const [numOfCoins, setNumOfCoins] = useState(0)

  function handleNumOfCoins () {
    setNumOfCoins(numOfCoins + 2); 
  }

  return (
    <div className="wrapper">
      <main>
        <Coin handleNumOfCoins={handleNumOfCoins} />
      </main>
      <footer>
        Your coin balance:
        <strong>{numOfCoins}</strong>
      </footer>
    </div>
  )
}

export default App
```

```js
import styles from './Coin.module.css';

function Coin({ handleNumOfCoins }) {
    return (
        <div className={styles.coinWrapper}>
          <button className="coin" onClick={handleNumOfCoins}>
            <span className="visually-hidden">Add 2 coin</span>
            <img className={styles.coinImage} alt="" src="https://sandpack-bundler.vercel.app/img/toonie.png" />
          </button>
        </div>
    )
}

export default Coin;
```

:::

Second, let's see the Svelte part.

::: code-group labels=[App.svelte, Coin.svelte]

```html
<script>
  import Coin from './Coin.svelte';

  let numOfCoins = $state(0);

  function handleNumOfCoins() {
    numOfCoins += 2;
  }
</script>

<div class="wrapper">
  <main>
    <Coin handleNumOfCoins={handleNumOfCoins} />
  </main>
  <footer>
    Your coin balance:
    <strong>{numOfCoins}</strong>
  </footer>
</div>
```

```html
<script>
    let { handleNumOfCoins } = $props();
</script>

<div class="coin-wrapper">
    <button class="coin" onclick={handleNumOfCoins}>
        <span class="visually-hidden">Add 2 coin</span>
        <img class="coin-image" alt="" src="https://sandpack-bundler.vercel.app/img/toonie.png" />
    </button>
</div>

<style>
/* Insert style here */
</style>
```

:::

React and Svelte has similarity to split the component but have different vibes or syntax. In React, to receive the props or properties in `Coin.jsx`, the `Coin` function must accept the object parameter `{}`. In Svelte, to receive the props in `Coin.svelte`, it use `$props` rune.

In React, to store and call CSS style, you should name it `_your_component.module.css` and import it as `import styles from './your_component.module.css'` then call the CSS class with syntax `{styles.cssClassName}`. This is intended to prevent conflict between each component in case there's the same CSS class name. In Svelte, you just put CSS style inside the component with `<style>` tag.

If we look the code above, we don't pass `numOfCoins` state in to the Coin component. Instead, we pass the handle function of update the `numOfCoins`. The handle function of update the `numOfCoins` has declared in `App` component. This is on purpose because we want to implement **Principle of Least Privilege**. In the `Coin` component, it just do one thing which is click the coin and hit the handle function which come from the props. Then, the value of `numOfCoins` updated on the `App` component. Think the **Principle of Least Privilege** as the term that give necessary power to the component. You may have heard a term that _Power tends to corrupt and absolute power corrupt absolutely_.

### Derived

Let's visit the Floating Coin. In this case, we add functionallity to buy a Chocolate with cost 9 coins. But, there's an issue.
The floating text appear when we press the "Buy chocolate" button.

Examples of [React - Floating Coin - Buy Chocolate](https://component-issue.floating-coin-react.pages.dev/) and [Svelte - Floating Coin - Buy Chocolate](https://component-issue.floating-coin-svelte.pages.dev/).

Here are React and Svelte code snippets.

::: code-group labels=[React, Svelte]

```js
import { useState } from 'react'
import Coin from './Coin'
import styles from './App.module.css'
import FloatingText from './FloatingText'

const CHOCOLATE_COST = 9 

function App() {
  const [numOfCoins, setNumOfCoins] = useState(0)
  const [numOfChocolates, setNumOfChocolates] = useState(0)

  function buyChocolate() {
    setNumOfCoins(numOfCoins - CHOCOLATE_COST);
    setNumOfChocolates(numOfChocolates + 1);
  }

  function handleNumOfCoins () {
    setNumOfCoins(numOfCoins + 2); 
  }

  return (
    <div className={styles.wrapper}>
      <main>
        <Coin handleNumOfCoins={handleNumOfCoins} />
        { numOfCoins > 0 && <div className={styles.floatingNumWrapper}>
          <FloatingText key={numOfCoins}>
            +2
          </FloatingText>
        </div> }
        <button disabled={numOfCoins < CHOCOLATE_COST} className={styles.shopItem}
        onClick={buyChocolate}>
          Buy chocolate {numOfChocolates > 0 && (`(${numOfChocolates})`)}
        </button>
      </main>
      <footer>
        Your coin balance:
        <strong>{numOfCoins}</strong>
      </footer>
    </div>
  )
}

export default App
```

```html
<script>
  import Coin from './Coin.svelte';
  import FloatingText from './FloatingText.svelte';

  const CHOCOLATE_COST = 9;

  let numOfCoins = $state(0);
  let numOfChocolates = $state(0);

  function buyChocolate() {
    numOfCoins = numOfCoins - CHOCOLATE_COST;
    numOfChocolates = numOfChocolates + 1;
  }

  function handleNumOfCoins() {
    numOfCoins += 2;
  }
</script>

<div class="wrapper">
  <main>
    <Coin handleNumOfCoins={handleNumOfCoins} />
    {#if numOfCoins > 0}
    <div class="floatingNumWrapper">
      {#key numOfCoins}
      <FloatingText>
        +2
      </FloatingText>
      {/key}
    </div>
    {/if}
    <button disabled={numOfCoins < CHOCOLATE_COST} class="shop-item" onclick={buyChocolate}>
      Buy chocolate {numOfChocolates > 0 ? (`(${numOfChocolates})`) : ''}
    </button>
  </main>
  <footer>
    Your coin balance:
    <strong>{numOfCoins}</strong>
  </footer>
</div>
```

:::

Here's the acceptance criteria:

- Buying a chocolate shouldn't re-trigger the "+2" animation
  - Chocolate cost 9 coins, so test this, you need to click the coin 5 times, and then click the "Buy chocolate"
- Clicking the coin should still show the "+2" animation
- The "+2" animation should still not be shown when the page first loads

Let's take a silence moment. What are the solutions for this problem?

> I give you a hint: There are two solutions to solve this problem. Let's guess it!

<p style="margin-bottom: 16rem; font-size: 1.5rem;"><strong>3</strong></p>
<p style="margin-bottom: 16rem; font-size: 1.5rem;"><strong>2</strong></p>
<p style="margin-bottom: 16rem; font-size: 1.5rem;"><strong>1</strong></p>

Ok! The solutions are create a new `state` or use `derived state`. You don't need to use `useEffect` or `$effect`. 😉

1. Create a new state called `floatingTextKey`. This state will handle when the `FloatingText` appeared.

::: code-group labels=[React, Svelte]

```js
import { useState } from 'react'
import Coin from './Coin'
import styles from './App.module.css'
import FloatingText from './FloatingText'

const CHOCOLATE_COST = 9 

function App() {
  const [numOfCoins, setNumOfCoins] = useState(0)
  const [numOfChocolates, setNumOfChocolates] = useState(0)
  const [floatingTextKey, setFloatingTextKey] = useState('initial');

  function buyChocolate() {
    setNumOfCoins(numOfCoins - CHOCOLATE_COST);
    setNumOfChocolates(numOfChocolates + 1);
  }

  function handleNumOfCoins () {
    setNumOfCoins(numOfCoins + 2); 
    setFloatingTextKey(crypto.randomUUID());
  }

  return (
    <div className={styles.wrapper}>
      <main>
        <Coin handleNumOfCoins={handleNumOfCoins} />
        { floatingTextKey !== 'initial' && <div className={styles.floatingNumWrapper}>
          <FloatingText key={floatingTextKey}>
            +2
          </FloatingText>
        </div> }
        <button disabled={numOfCoins < CHOCOLATE_COST} className={styles.shopItem}
        onClick={buyChocolate}>
          Buy chocolate {numOfChocolates > 0 && (`(${numOfChocolates})`)}
        </button>
      </main>
      <footer>
        Your coin balance:
        <strong>{numOfCoins}</strong>
      </footer>
    </div>
  )
}

export default App
```

```html
<script>
  import Coin from './Coin.svelte';
  import FloatingText from './FloatingText.svelte';

  const CHOCOLATE_COST = 9;

  let numOfCoins = $state(0);
  let numOfChocolates = $state(0);
  let floatingTextKey = $state('initial');

  function buyChocolate() {
    numOfCoins = numOfCoins - CHOCOLATE_COST;
    numOfChocolates = numOfChocolates + 1;
  }

  function handleNumOfCoins() {
    numOfCoins += 2;
    floatingTextKey = crypto.randomUUID();
  }
</script>

<div class="wrapper">
  <main>
    <Coin handleNumOfCoins={handleNumOfCoins} />
    {#if floatingTextKey !== 'initial'}
    <div class="floatingNumWrapper">
      {#key floatingTextKey}
      <FloatingText>
        +2
      </FloatingText>
      {/key}
    </div>
    {/if}
    <button disabled={numOfCoins < CHOCOLATE_COST} class="shop-item" onclick={buyChocolate}>
      Buy chocolate {numOfChocolates > 0 ? (`(${numOfChocolates})`) : ''}
    </button>
  </main>
  <footer>
    Your coin balance:
    <strong>{numOfCoins}</strong>
  </footer>
</div>

<style>
/* Insert style here */
</style>
```

:::

2. Create a derived state called `totalCoinsWasted`. This is a derived state from calculation of `numOfCoins` and `numOfChocolates`.

::: code-group labels=[React, Svelte]

```js
import { useState } from 'react'
import Coin from './Coin'
import styles from './App.module.css'
import FloatingText from './FloatingText'

const CHOCOLATE_COST = 9 

function App() {
  const [numOfCoins, setNumOfCoins] = useState(0)
  const [numOfChocolates, setNumOfChocolates] = useState(0)

  // Derived value
  // We calculate how much coin user has wasted by
  // adding the value of number of chocolates to their current coin balance:
  const totalCoinsWasted = numOfCoins + numOfChocolates * CHOCOLATE_COST;

  function buyChocolate() {
    setNumOfCoins(numOfCoins - CHOCOLATE_COST);
    setNumOfChocolates(numOfChocolates + 1);
  }

  function handleNumOfCoins () {
    setNumOfCoins(numOfCoins + 2); 
  }

  return (
    <div className={styles.wrapper}>
      <main>
        <Coin handleNumOfCoins={handleNumOfCoins} />
        { totalCoinsWasted > 0 && <div className={styles.floatingNumWrapper}>
          <FloatingText key={totalCoinsWasted}>
            +2
          </FloatingText>
        </div> }
        <button disabled={numOfCoins < CHOCOLATE_COST} className={styles.shopItem}
        onClick={buyChocolate}>
          Buy chocolate {numOfChocolates > 0 && (`(${numOfChocolates})`)}
        </button>
      </main>
      <footer>
        Your coin balance:
        <strong>{numOfCoins}</strong>
      </footer>
    </div>
  )
}

export default App
```

```html
<script>
  import Coin from './Coin.svelte';
  import FloatingText from './FloatingText.svelte';

  const CHOCOLATE_COST = 9;

  let numOfCoins = $state(0);
  let numOfChocolates = $state(0);

  // We calculate how much coin user has wasted by
  // adding the value of number of chocolates to their current coin balance:
  const totalCoinsWasted = $derived(numOfCoins + numOfChocolates * CHOCOLATE_COST);

  function buyChocolate() {
    numOfCoins = numOfCoins - CHOCOLATE_COST;
    numOfChocolates = numOfChocolates + 1;
  }

  function handleNumOfCoins() {
    numOfCoins += 2;
  }
</script>

<div class="wrapper">
  <main>
    <Coin handleNumOfCoins={handleNumOfCoins} />
    {#if totalCoinsWasted > 0}
    <div class="floatingNumWrapper">
      {#key totalCoinsWasted}
      <FloatingText>
        +2
      </FloatingText>
      {/key}
    </div>
    {/if}
    <button disabled={numOfCoins < CHOCOLATE_COST} class="shop-item" onclick={buyChocolate}>
      Buy chocolate {numOfChocolates > 0 ? (`(${numOfChocolates})`) : ''}
    </button>
  </main>
  <footer>
    Your coin balance:
    <strong>{numOfCoins}</strong>
  </footer>
</div>

<style>
/* Insert style here */
</style>
```

:::

Now, let's compare how much KB of JavaScript we get in both of solution by using `npm run build`.

::: code-group labels=[React, Svelte]

```sh
# Solution 1 - Add new state
dist/assets/index-BaPjxjso.js   144.35 kB │ gzip: 46.56 kB

# Solution 2 - with derived state
dist/assets/index-Dwi4HC3b.js   144.29 kB │ gzip: 46.52 kB
```

```sh
# Solution 1 - Add new state
dist/assets/index-CYXFLywj.js   15.56 kB │ gzip: 6.61 kB

# Solution 2 - with derived state
dist/assets/index-D8mISLR_.js   13.56 kB │ gzip: 5.87 kB
```

:::

As we can see, that derived state give less KB of JavaScript instead of add new state. Although the difference size is trivial, but if we build rich features web apps, the derived state is a one of our saviours for optimize the performance. Why do I care about this? Because the cost of JavaScript to load in a web browser can be costly especially for low-end device. Please read [The Cost of JavaScript](https://medium.com/dev-channel/the-cost-of-javascript-84009f51e99e) or watch video [The Cost of JavaScript](https://www.youtube.com/watch?v=ZKH3DLT4BKw) created by Addy Osmani too.

Let's talk more about derived state. What is this?

"Derived state" (or values derived from state) refers to data that is calculated or computed based on your existing state values, rather than being stored directly in the state itself.

Here's the example.

```js
const state = {
  firstName: "Ishigami",
  lastName: "Senku",
  birthYear: 2004
};

// This is derived from state
const fullName = `${state.firstName} ${lastName}` // Ishigami Senku
const age = new Date().getFullYear() - state.birthYear // Current age
```

The benefits of using derived state are:

1. Avoid data redundancy - you don't store data that can be calculated.
2. Ensure consistency - derived values automatically update when base state changes.
3. Better performance - you don't need to manually keep multiple state values in sync.

### Effect

In short, you use the `effect` for:

1. Making network requests
2. Manage timeouts / intervals
3. Listening for global events
4. Direct DOM manipulation

### Hooks and Signal

React use Hooks to update and track state changes and Svelte use Signal to update and track state changes. Let's talk Hooks and Signal outside the Frameworks.

Hooks are based on function composition - they're functions that provide additional functionallity through closures and return values. Each time the component function runs, the hooks run in sequence to build up the component's state and behavior.

```js
// Conceptually, hooks work like this
function useState(initialValue) {
  let state = initialValue;
  
  const setState = (newValue) => {
    state = newValue;
    // trigger re-render
  };
  
  return [state, setState];
}
```

Signals are based on reactive programming principles - they're references to values that can notify subscribers when they change. They maintain a dependency graph of computations that depend on their values.

```js
// Conceptually, signals work like this
class Signal {
  constructor(value) {
    this._value = value;
    this.subscribers = new Set();
  }
  
  get value() {
    // Track dependencies
    return this._value;
  }
  
  set value(newValue) {
    this._value = newValue;
    // Notify subscribers
    this.subscribers.forEach(sub => sub());
  }
}
```

### Frameworks

Svelte framework is SvelteKit. I have use it for build several personal products [like list of original soundtrack of anime I've watched since childhood](https://anime.kresna.me), [list of books I have read and review in Bahasa Indonesia and English](https://buku.kresna.me), and [a utility to compare what files changed when upgrading your Laravel framework. Kind a Laravel Shift but tiny and manual](https://laraveldiff.org).

React frameworks are NextJS and React Router v7 a.k.a. Remix. I don't use those frameworks but If I have to choose, I prefer React Router v7 over NextJS because I saw in tweets that [people complain NextJS about memory in development mode that consume more than 1GB](https://x.com/programmer30an/status/1867474270320046568), [inconsistency API design](https://pilcrow.vercel.app/blog/nextjs-why), and [a company switch their stack from NextJS to Ruby on Rails because NextJS doesn't fullfil their needs](https://x.com/shpigford/status/1753188910304301260?s=46).

## Personal Choice

If I bring the term of vibes, React has a good vibes but Svelte has a great vibes. Why I say Svelte has a great vibes? Because Svelte doesn't sacrifice the programming experience and user experience. For programming experience, you just need the fundamental knowledge of HTML, CSS, and JavaScript instead of steep learning curve provided by React. For user experience, JavaScript size in Svelte is less than React thanks to compiler and signal implementation by Svelte team. By shipping the less, tightly-optimized JavaScript, user still can get good experience when access web app.

> Achieve the same thing you just need a least of power (JavaScript).