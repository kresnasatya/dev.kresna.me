---
title: Can You See a Slow Spot?
description: In this case we will see which code is a slow spot when import a large CSV file.
pubDate: 2024-09-24
author: Kresna Satya
---

I create a project with Laravel Framework called Larva Interactions, a common use cases using Larva stack (Laravel + Livewire + AlpineJS + TailwindCSS).

> Hold on! There's a term called TALL stack. Do you know that?

Yes I know. But, I want to create a another term and Larva sounds cool!

One of use cases in Larva Interactions is Job Batching that shipped in Laravel since version 8. In this case, I use CSV file as an example for Job Batching. The flow is simple:

1. Upload CSV;
2. Press "import" button for import CSV records into a table in database;
3. Process the CSV file behind the scene using Job Batching, keep progress of jobs using `$batch` and `wire:poll`. 

Ok, now I want to give you two codes and I want you analize both of them. Which one is a slow spot?

::: code-group labels=[Code 1, Code 2]

```php
<?php
function import() {
    $path = base_path('csvfile/file.csv');

    $file = fopen($path, 'r');

    if ($file !== false) {
        $header = array_map(function ($head) {
            return implode('_', explode(' ', strtolower($head)));
        }, fgetcsv($file));
        $data = [];
        if ($header !== false) {
            while (($record = fgetcsv($file)) !== false) {
                array_push($data, $record);
            }

            $batch = Bus::batch([])->dispatch();
            collect($data)->chunk(1000)->each(function ($chunk) use ($header, $batch) {
                $arrs = [];
                foreach ($chunk as $item) {
                    $arr = array_combine($header, $item);
                    array_push($arrs, $arr);
                }
                $batch->add(new ProcessInsertRecord('table_name', $arrs));
            });


            $this->batchId = $batch->id;
        }
    }
}
```

```php
<?php
function import() {
    $path = base_path('csvfile/file.csv');

    $file = fopen($path, 'r');

    if ($file !== false) {
        $header = array_map(function ($head) {
            return implode('_', explode(' ', strtolower($head)));
        }, fgetcsv($file));
        
        if ($header !== false) {
            $batch = Bus::batch([])->dispatch();
            $chunk = [];
            $chunkSize = 1000;
            while (($record = fgetcsv($file)) !== false) {
                $chunk[] = array_combine($header, $record);

                if (count($chunk) === $chunkSize) {
                    $batch->add(new ProcessInsertRecord('table_name', $arrs));
                    $chunk = [];
                }
            }
            
            if (!empty($chunk)) {
                $batch->add(new ProcessInsertRecord('table_name', $arrs));
            }

            $this->batchId = $batch->id;
        }
    }
}
```

:::

<p style="margin-bottom: 8rem; font-size: 1.5rem;"><strong>3</strong></p>
<p style="margin: 8rem 0; font-size: 1.5rem;"><strong>2</strong></p>
<p style="margin: 8rem 0; font-size: 1.5rem;"><strong>1</strong></p>

The answer is **Code 1**. The reason is we push data into array inside `while` loops. Then, after `while` loops finish, we chunk it per 1000 then add the chunk into job batching. For 100 to 1000 lines (exclude the header) are not the problem. But, after 1001 until million or billion lines of record it will lead a big problem! At that time, I wasn't realize that after I see an answers from Stackoverflow about store a large dataset inside array will increase memory.

> Now repeat after me 3 times.

> Store data inside array then memory increased!

> Store data inside array then memory increased!

> Store data inside array then memory increased!

That's why you and I need to learn fundamentals of Computer Science. Sometimes, I learn the fundamentals but I cannot figure out when to use these things in real world. Wow! I learn a thing today!

Let's take a look in **Code 2**. Instead of wait `while` loop finish, let's interrupt it by set a limit named `$chunkSize`. Then, push the `$chunk` into the job batching when the amount of chunk matches with `$chunkSize`, set `$chunk` into empty array again and loop again. If there's still any left, just execute it outside the loop. That's it.

My friend, [Wayan Jimmy](https://x.com/jimmyeatcrab) told to me that I can use `yield` keyword. I will quote it from PHP documentation about the purpose of `yield` because it's the best explaination.

> The heart of a generator function is the yield keyword. In its simplest form, a yield statement looks much like a return statement, except that instead of stopping execution of the function and returning, yield instead provides a value to the code looping over the generator and pauses execution of the generator function.

In the end, `yield` act as play and pause execution of function. It acts as it needs to. We usually see `yield` in looping statement like `for`, `foreach`, and `while`. Let's make combine it with `LazyCollection` feature in Laravel.

```php
<?php

function start() {
    $records = LazyCollection::make(function () {
        $handle = fopen(base_path('csvfile/file.csv'), 'r');

        $header = fgetcsv($handle);
        while (($line = fgetcsv($handle)) !== false) {
            yield array_combine($header, $line);
        }
    });

    $batch = Bus::batch([])->dispatch();
    $records->chunk(1000)->each(function ($chunk) use ($batch) {
        $batch->add(new ProcessInsertRecord('table_name', $chunk->toArray()));
    });
}
```

That's it! Now, the question is: Do I really need to use user interface to process job batching for above than one million records or billion records? Hmm, maybe not. It takes a lot of time! Let's process it behind the scene and just use single Job instead of Job Batching for that case.

**Reference**

- [How to parse a csv file that contains 15 million lines of data in php?](https://stackoverflow.com/questions/60803152/how-to-parse-a-csv-file-that-contains-15-million-lines-of-data-in-php)
- [Handling large CSVs with Laravel - Aaron Francis](https://aaronfrancis.com/2020/handling-large-csvs-with-laravel-89a5bfc1)
- [Lazy Collections in Laravel - Joseph Silber](https://josephsilber.com/posts/2020/07/29/lazy-collections-in-laravel)