# React-Rebuild

**React-Rebuild** is an open-source project aimed at creating a from-scratch implementation of React 18 with TypeScript. This project aspires to replicate all core functionalities, features, and APIs of the official React library, providing an identical development experience.

## Goals

- **Full Implementation**: Recreate core essential features of React, including JSX and React Element, Fiber, virtual DOM, reconciliation algorithm, lifecycle methods, and Hooks.
- **Educational**: Offer developers an opportunity to gain an in-depth understanding of React's inner workings. By reading and contributing to the codebase, developers can master advanced front-end development skills.
- **Reference**: Serve as a reference for developers who wish to compare their implementations with the official React library, enabling the creation of customized or optimized versions of React.

## Features

- **Fiber Architecture**: Implement React's Fiber architecture for efficient rendering and reconciliation.
- **Reconciliation**: Accurate implementation of React's reconciliation algorithm for efficient UI updates.
- **Hooks**: Implement core official React Hooks (`useState`, `useEffect`, etc.).

## Relevant Posts
Meanwhile, I will also be writing a series of posts. This series of posts aims to document my insights and assist other developers in exploring React's inner workings. The series includes:

- [Understanding React - Part 0. Introduction](https://www.tory.cool/blog/understanding-react-part-0-introduction)
- [Understanding React - Part 1. React Element, JSX and Fiber](https://www.tory.cool/blog/understanding-react-part-1-react-element-jsx-and-fiber)
- 🚧...

## Installation

We use [pnpm](https://pnpm.io/) as our package manager. To install React-Rebuild, follow these steps:

```bash
git clone git@github.com:torytang025/react-rebuild.git
cd react-rebuild
pnpm install
```

## Debugging

To debug React-Rebuild, you can follow these steps:

1. **Start a Development Server:** Run `pnpm dev` to start a development server that watches file changes and compiles the latest output of the `react` and `react-dom` packages.
2. **Run Demo Pages:** Use `pnpm demo:react` to start a demo frontend page. This replaces the official `react` and `react-dom` packages with the output from step 1, allowing you to conveniently write and test demo code.
3. **Debugging with Visual Studio Code:** If you're using VS Code, switch to `Run and Debug` and utilize existing debug configurations.
4. **Adding Breakpoints:** Set breakpoints by clicking the red-filled circles in the editor margin or add `debugger` statements in your code to pause execution and inspect debug information.

## Contributing

We welcome contributions from developers of all skill levels. Whether you're fixing bugs, improving documentation, or implementing new features, your help is appreciated.

## Contact

For any questions or discussions, feel free to open an issue or contact the maintainers at [torytang.025@gmail.com].

---

Thank you for your interest in React-Rebuild! We hope this project helps you understand React better and provides a solid foundation for your own custom React implementations.
