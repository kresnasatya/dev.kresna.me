---
title: Side Effects of Wildcards %% Operator in SQL
pubDate: 2024-11-04
description: Every shortcut has a side effects like your medicine.
author: Kresna Satya
---

Yesterday, I see [a tweet that discuss about optimization on real app in productions](https://x.com/rubi1945/status/1852765236245483677). In short, the root cause is the wildcards operator `%%` in SQL especially in `LIKE` clause. The `%` is doubled rather than single. Because of this, I immediately check the code program in my company currently I'm working on. Then, it turns out that I do a mistake. Maybe you can call it skill issue? But, I think it's not. It's a combination of sloppy and not knowing what's exactly the side effects when you use a tool.

Let me explain about the wildcard operator little bit. Imagine the Yellow Pages book.

**Case 1: `'%abc'`**

It means SQL matches strings that END with "abc". Examples: "abc", "321abc", "zxyabc", and so on.
This requires full table scan and can lead performance issue even though you have set and index in a certain column.

**Case 2: `'%abc%'`**

It means SQL matches strings that contain "abc" anywhere. Examples: "abc", "123abc321", "123abc", "abcdef", and so on. This is more bad than the previous one, requires full table scan, and lead performance issue even though you have set and index in a certain column.

**Case 3: `'abc%'`**

It means SQL matches strings that START with "abc". Examples: "abc", "abcefg", "abc321", and so on. This is the most performant than two cases above. It can utilize index if you have set and index in a certain column. But, this is only good for where user know the beginning of the string. For example, user search a document without knowing the exact title. Then, he/she will put a word that him/her remember and hopes that it will appears one or maybe of results. In this case the `'abc%'` is not a good choice but the `'abc%'` does.

> Well, in the end every solution maybe has a side effects like your medicine.

> Do you have a solution?

Maybe you can use a FULLTEXT index if you want to implement text search. This is suitable too for user search a document with title or even context. But, don't expect the results will return exactly one results. In short, the behaviour for FULLTEXT index is a search engine.

> Again, in the end every solution maybe has a side effects like your medicine.

If you need more supplements for the wildcards operator in LIKE clause SQL, here we are:

- [Sargability: Why %string% Is Slow](https://www.brentozar.com/archive/2010/06/sargable-why-string-is-slow/)
- [Indexing for wildcard searches](https://planetscale.com/learn/courses/mysql-for-developers/indexes/indexing-for-wildcard-searches?autoplay=1#querying-for-specific-words-or-phrases)
- [Indexing LIKE Filters](https://use-the-index-luke.com/sql/where-clause/searching-for-ranges/like-performance-tuning)



