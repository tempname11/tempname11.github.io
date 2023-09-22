---
layout: post
title: "Cross-compiling for ARM64"
date: 2023-09-22 00:00:00 -0000
permalink: /posts/cross-compliing-for-arm64
---

# Cross-compiling for ARM64

Here is my experience cross-compiling [svfc](https://github.com/tempname11/svf/commit/f64f00cae65950c3606d71af1e0aee982ddd41ab), mainly for `ARM64` (aka `AArch64`) platforms. It turned out to be surprisingly easy with the tools I am using, namely Clang and CMake.

Clang is [described in its documentation](https://clang.llvm.org/docs/CrossCompilation.html) as being "natively a cross-compiler", and it looks like a big win, as I remember fussing with needing some specially-built cross-compilers years ago. You still need to have the toolchain (i.e. headers, libraries, ...) for your platform, and some way to specify it to Clang, which CMake helpfully makes easy. Here are the details for the three major desktop OS-es:

## macOS

This was the easiest one. Clang comes with Xcode Command Line Tools, and everything just works. I tried compiling on `ARM64` ("Apple Silicon" Mac) for `x64` (Intel Mac), and vice versa, and both ways worked.

CMake just needs the following variables set, either via `-DVARIABLE_NAME=value` when invoking `cmake` initially, or by using a toolchain file:

```cmake
set(CMAKE_SYSTEM_NAME Darwin)
set(CMAKE_SYSTEM_PROCESSOR arm64)
set(CMAKE_C_COMPILER_TARGET aarch64-apple-darwin)
set(CMAKE_CXX_COMPILER_TARGET aarch64-apple-darwin)
set(CMAKE_C_COMPILER clang)
set(CMAKE_CXX_COMPILER clang++)
```

[CMAKE_SYSTEM_NAME](https://cmake.org/cmake/help/latest/variable/CMAKE_SYSTEM_NAME.html) needs to be set explicitly (even if it's the same as native), because that's how CMake knows we are cross-compiling.

The GitHub Actions runner [macos-12](https://github.com/actions/runner-images/blob/main/images/macos/macos-12-Readme.md) already had everything needed, so CI was a breeze.

## Windows

I needed to install `MSVC v142 - VS 2019 C++ ARM64 build tools (Latest)` (via Visual Studio Installer) on my `x64` dev machine. Otherwise, it was very similar, with the following CMake variables:

```cmake
set(CMAKE_SYSTEM_NAME Windows)
set(CMAKE_SYSTEM_PROCESSOR arm64)
set(CMAKE_C_COMPILER_TARGET aarch64-windows-msvc)
set(CMAKE_CXX_COMPILER_TARGET aarch64-windows-msvc)
set(CMAKE_C_COMPILER clang)
set(CMAKE_CXX_COMPILER clang++)
```

The GitHub Actions runner [windows-2022](https://github.com/actions/runner-images/blob/main/images/win/Windows2022-Readme.md) had the `ARM64` build tools installed already, although the packages listed there have a different naming scheme - I think `Microsoft.VisualStudio.Component.VC.Tools.ARM64` is the one.

Since I am using Clang, I also have to select Ninja as the build generator, but that's true for non-cross builds as well.

## Linux

Clang seems to be using the GCC toolchain in Linux by default, and I had to install the following packages on my `x64` Ubuntu:
```sh
sudo apt install gcc-aarch64-linux-gnu binutils-aarch64-linux-gnu libstdc++-12-dev-arm64-cross
```

... and a similarly compact CMake toolchain file worked:

```cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR arm64)
set(CMAKE_C_COMPILER_TARGET aarch64-linux-gnu)
set(CMAKE_CXX_COMPILER_TARGET aarch64-linux-gnu)
set(CMAKE_C_COMPILER clang)
set(CMAKE_CXX_COMPILER clang++)
```

The GitHub Actions runner [ubuntu-22.04](https://github.com/actions/runner-images/blob/main/images/linux/Ubuntu2204-Readme.md) needs the same `apt` packages listed above.

## Caveats

I did not try "cross-OS" builds. I would imagine this might also be possible, but much less convenient.

I tested the cross-compiled `ARM64` binaries on macOS, but not on Windows/Linux yet. Such platforms are rare, but maybe I will get to running them virtualized later.

## A note on CMake

CMake is wonderful and terrible at the same time. While I value being able to "just" compile stuff, there are some major drawbacks:
- The inablity to see why and how, the exact commands with the exact flags are finally executed. You can't see the inner workings, so the only way to get it to do exactly what you want, is to fiddle until you "guess right".
- The "two-step" build system does not help in this regard, making things doubly-opaque.
- The documentation is very unfriendly, where every page seems to assume you know everything else. After some time you used to it, though.
- The built-in language is `bash`-level terrible, and there is no real reason for it to be a special bespoke language, aside from historical and compatibility reasons.

It's still a useful tool, as evidenced by this post... but I wish it were much better.
