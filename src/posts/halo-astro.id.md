---
title: 'Halo Astro!'
pubDate: 2024-06-01
description: "Astro. Astro Boy? Astro (Korean Boyband)? Bukan! Astro yang saya maksud adalah sebuah web framework. Pertama kali saya melihat Astro, saya berpikir ini adalah Static Site Generator (SSG) yang sama seperti Hugo, sebuah SSG yang cepat dibuat dengan bahasa pemrograman Go. Astro juga membuat engine mereka menggunakan bahasa pemrograman Go. Astro menawarkan dua fitur yang mana saya tidak dapat menahan diri untuk mencobanya."
author: 'Kresna Satya'
---

Astro. Astro Boy? Astro (Korean Boyband)? Bukan! Astro yang saya maksud adalah sebuah web framework. Pertama kali saya melihat Astro, saya berpikir ini adalah Static Site Generator (SSG) yang sama seperti Hugo, sebuah SSG yang cepat dibuat dengan bahasa pemrograman Go. Astro juga membuat engine mereka menggunakan bahasa pemrograman Go. Astro menawarkan dua fitur yang mana saya tidak dapat menahan diri untuk mencobanya.

> *Omong-omong, situs personal saya dibuat menggunakan Hugo.*

Pertama, konsep Island Architecture. Konsep ini diperkenalkan oleh Jason Miller (Preact’s creator). Saya akan memasukkan penjelasannya di tulisan ini.

> *The general idea of an “Islands” architecture is deceptively simple: render HTML pages on the server, and inject placeholders or slots around highly dynamic regions. These placeholders/slots contain the server-rendered HTML output from their corresponding widget. They denote regions that can then be "hydrated" on the client into small self-contained widgets, reusing their server-rendered initial HTML.*

Saya membayangkan placeholders/slots seperti header, sidebar, dan image carousel (dibungkus oleh tag `<main></main>` HTML) di halaman HTML web. Hal-hal tersebut bentuknya bisa konten statis atau dinamis yang dimuat oleh JavaScript. Di Astro, mereka membayangkan Island Architecture sebagai komponen UI yang iteraktif di suatu halaman dengan istilah "**interactive widget** mengambang di lautan HTML yang statis, ringan, dan dirender di server". **Interactive widget** ini memicu AHA momen pada diri saya.

> *Widget!? AHA! Ini mengingatkanku dengan widget kalender, popular posts yang ada di Blogspot dan WordPress.*

Sebenarnya, Island Architecture berasal dari "Component Islands" yang dicetuskan oleh Katie Sylor. Sejujurnya, saya cukup yakin sekitar tahun 2019 dan 2020, saya melihat video presentasi dari Katie Sylor-Miller di YouTube atau Vimeo tentang “Component Islands” tetapi saya tidak melihatnya lagi dimanapun. Saya tidak yakin apakah saya berhalusinasi atau tidak, tetapi saya cukup yakin bahwa saya tidak berhalusinasi tentang itu.

Kedua, Astro menyediakan UI agnostik. Artinya, kamu bisa menyisipkan JavaScript framework favorit kamu ke dalam Astro. Sejauh ini, Astro mendukung Preact, React, Svelte, Vue, Lit, dan Solid. Saya memilih Svelte sebagai JavaScript framework favorit walaupun saya belum memakainya secara serius di suatu proyek. Saya menyukai Svelte karena sintaks yang ringkas dan marketing serta filosofi yang dinarasikan oleh Rich Harris tentang membangun pengembangan web yang lebih baik dengan sedikit konsep yang lebih mudah (Saya membicarakan kamu, ReactJS). Saya tidak sabar untuk memasukkan kode Svelte di situs ini di waktu yang akan datang!

Situs ini masih dalam tahap pengerjaan. Saya memiliki beberapa ide untuk situs ini di waktu yang akan datang. Ide-ide tersebut antara lain dual bahasa (Bahasa Indonesia dan Inggris), fitur pencarian (cmd + k dari situs milik Jacky Efendi), fitur mode gelap, dan mini-playground. Saya akan menggunakan Bahasa Inggris sebagai bawaan dari situs ini karena saya ingin berinteraksi dengan programmer di seluruh dunia atau siapapun yang memiliki ketertarikan topik yang sama dengan saya.