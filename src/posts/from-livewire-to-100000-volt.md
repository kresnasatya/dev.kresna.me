---
title: From Livewire to 100.000 Volt
description: The reason why I migrate classic Livewire components into Livewire Volt components.
pubDate: 2024-11-22
author: Kresna Satya
---

Yesterday, I with my coworker get a project to make a web app. This web app is related with project management. In summary, manager can create a project and create tasks based on the project. Each tasks assign to the staff. Looks simple, but if we got into the detail, it's not easy as it says. I with my coworker agree that we use Larva (Laravel, Livewire, Tailwind, and Alpine) stack to create this web app. The problem comes when we want to create a component for a list of projects and project form. In Livewire, programmer give a choice to make a component either as full page component or literally a component.

```sh
php artisan livewire:make ProjectIndex
# or
php artisan livewire:make ProjectCreate
# or
php artisan livewire:make Project/Index
# or
php artisan livewire:make Project/Create
```

> The choice is back to you.

With the many choice above, sometimes it can lead you to a "trap". If you implement one of among choice above, my prediction is you will get two file: a Livewire Controller in `App\Livewire` and a Livewire View in `resources/views/livewire`. When you want to edit something then you must stand by to split your brain between logic in `App\Livewire` and blade in `resources/views/livewire`. If the components around 10 to 20 is okay. But, how about more than 20 components? No no no no! 😱 I get a nightmare.

Fortunately, [Livewire Volt](https://livewire.laravel.com/docs/volt) come to rescue. With Volt, the controller and view merge into a single file which is the view it self. I just need to focus my brain to a single file. Let's give a shot by create a simple Livewire Volt component called Counter.

```sh
# Make sure you install livewire/volt first!
composer require livewire/volt
```

```sh
# Mount Livewire Volt service provider
php artisan volt install
```

```sh
# Create a class-based counter component
php artisan make:volt counter --class
```

```php
// resources/views/livewire/counter.blade.php
<?php
 
use Livewire\Volt\Component;
 
new class extends Component {
    public $count = 0;

    public function increment()
    {
        $this->count++;
    }
}
?>
 
<div>
    <h1>{{ $count }}</h1>
    <button wire:click="increment">+</button>
</div>
```

Let's compare it with the "old" Livewire.

::: code-group labels=[app/Livewire/Counter.php, resources/views/livewire/counter.blade.php]

```php
<?php

namespace App\Livewire;

use Livewire\Component;

class Counter extends Component
{
    public $count = 1;

    public function increment()
    {
        $this->count++;
    }

    public function render()
    {
        return view('livewire.counter');
    }
}
```

```html
<div>
    <h1>{{ $count }}</h1>
    <button wire:click="increment">+</button>
</div>
```

:::

I wish you get the point what I want to tell you in this post. Well, Livewire Volt is actually for programmers who have experience with the "old" Livewire way and see the pain point with the "old" way. If you want to get your hands dirty with Livewire Volt, I encourage you to try [Laravel Bootcamp and choose Livewire section](https://bootcamp.laravel.com/livewire/installation). I have [migrate my "old" Livewire into Livewire Volt](https://youtu.be/Hffc1zi29Ts) into my project called [Larva Snippets](https://larva-snippets.fly.dev). Now, you get 100.000 volt power! ⚡️⚡️⚡️