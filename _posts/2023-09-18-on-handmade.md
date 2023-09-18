---
layout: post
title: "On \"Handmade\""
date: 2023-09-18 00:00:00 -0000
permalink: /posts/on-handmade
---

# On "Handmade"

"Handmade" is now a name [for](https://handmadehero.org/) [many](https://handmade.network/) [things](https://handmadecities.com/). Over the years, I never got involved in the related communities much myself, but the ethos always spoke to me, so I was at least watching from the sidelines.

And I see many people with many different ideas of what "Handmade" is for them. Of course, no one owns the term, so no single definition is "right", and everyone can have their own view. I wanted to describe what "Handmade" means to me, partly as an exercise for myself, and partly to reference this post later if needed. Now, some of the ideas here might not even intersect with other people's ideas of "Handmade" that much; this is my own lens and worldview.

## Ideas

Here are some ideas I find valuable:

### 1.

_Abstraction often causes more problems than it solves._

The whole idea of OOP, as popularized in the 90's, is now deeply ingrained in the industry. And it actually is a useful technique! However, the extent to which it is now casually used, has caused immense harm to the software industry as a whole **(*)**. Every new abstraction causes the mental model of what is actually happening to become more complicated, and the code less direct. Popular abstractions then influence languages to adopt them, make them easy to use, leading to whole new generations of programmers treating these abstractions as the new "base" on top of which you are supposed to build things, never questioning them, shoehorning them into problems that do not require them. And the "low-level" knowledge gets delegated to someone else, as an "implementation detail".

The more general claim actually sounds like this: some solutions also cause problems as a byproduct, and, in the perpetual chase for "the best way" to do something, people often over-value the benefits, and under-value the "second-order" problems. Then, they start solving the "second-order" problems...

**(*)** Counterfactually. But who knows what would have happened if OOP were not popular? Maybe the fast growth of the industry would have caused similar problems, no matter the dominant paradigm? Or maybe OOP was [inevitable](https://en.wikipedia.org/wiki/Conway%27s_law)?

### 2.

_Low-level does not mean complicated; in fact, it's often the opposite._

Working with memory directly is intimidating to many people. When it goes wrong, it can go really wrong, with dreaded, hard-to-debug memory corruptions, leaks, data races and whatnot. However, if you know what you are doing, these things can be minimized, mitigated, and the remaining few ones just braved out. And at it's core, the operations involved are not that complicated, in fact, they are much simpler than most high-level languages' feature sets.

When you know some tricks on how to work with memory directly, and learn to avoid the pitfalls, things can start getting quite magical. Because suddenly, everything is under your direct control with no middlemen, and many problems start looking almost easy. And "everything" includes performance and memory usage.

### 3.

_The skill ceiling is very high._

Like many people in the community, I got hooked by following [Casey Muratori's Handmade Hero](https://handmadehero.org/). At the time, it was a revelation, as if I got secret access to some forgotten knowledge. And it made me realize that, even though I considered myself reasonably experienced at the time, that... There. Is. So. Much. To. Learn.

###

## Anti-ideas

And here are some ideas I find harmful, which a naive observer might still associate with "Handmade".

### -1.

_Everything must be built by hand, tailored to your exact problem._

Now, this one is a bit of a pickle, because it's in the name: _hand-made_. The voice whispers: make it from scratch. [Reinvent the wheel](https://handmade.network/jam/2023). Don't re-use anything and always do it some clever new way, every single time.

Obviously, this is a grotesque mis-representation, but I feel like some people do partially (if only slightly) believe this, not the least because it's a very alluring idea for some types of personality (I know it first hand). The end result? New projects are toyed with and then abandoned some time later, and nothing of value gets created. Best case, it's a learning experience. Worst case, it's a waste of time.

Now, sometimes it does make sense to do it from scratch. Educational purposes (for yourself, or the others) are a very good fit. Interestingly, the [original "Handmade" project](https://handmadehero.org/) is a huge educational success, while at the same time a total failure as a game product (the FAQ states it is/was a "project to create a **complete**, professional-quality game" - emphasis mine). I think this is often brushed under the carpet a bit, maybe because admitting that it was a partial failure raises questions about the approach. Personally, I think it's more healthy to admit failures when they happen, and use them as information for what to change.

I mentioned the upcoming [Handmade Network Jam](https://handmade.network/jam/2023) in jest above, and while I really think it's a great thing, at the same time some of the messaging around it is ambiguous and might lead inexperienced people into this bad mindset. I think it's important to be aware that while learning and exploring new ideas can certainly lead to building good products later on, it is definitely not the same activity.

### -2.

_Everything must be optimized to the bone; no clock cycle must be spent in vain._

While it's true that a lot of software we use every day is slower than it could theoretically be, actually getting to that theoretical maximum is not always a good idea. It is true that software flexibility and performance are fundamentally at odds... if you take one or the other to the extreme. If you don't, there's typically a sane way to get good performance **and** flexibility, which is:

- Pick some reasonable assumptions about your problem space, and your platform (e.g. hardware).
- Design your solution as the simplest "mapping" between the platform and the problem space.
- Simplest, as in "simplest solution that comes to mind, using primitves that work well", and not "contorted code golf solution that is technically even simpler".
- Whenever you think you need something extra "to future-proof", hold off from doing that until you really need it.

Essentially, if you only ever write simple code, then **A)** it's not that hard to change, and **B)** it's not that hard to make it go faster, if needed. But chasing one of those two goals directly is perilous.

This is not a universal solution, but it works for me well in many scenarios. 

### -3.

_Do it yourself. Don't cease control over the code._

In moderation, this may be sound advice, especially for critical parts of the product. But taken to the extreme, it leads to endless [NIH](https://en.wikipedia.org/wiki/Not_invented_here) syndrome. This is simply not practical if you are actually solving problems (as opposed to learning).

I think a more pragmatic approach is to use existing solutions where appropriate, but view them with a critical eye - are they pulling their weight? Basically, pick your battles.
