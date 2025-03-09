# Rocketleague golf

![Game Screenshot](public/game.png)

*Vibecoded with Claude 3.7 Sonnet*

A browser-based 3D Rocket League-inspired golf game built with Next.js, React, Three.js (via React Three Fiber), and Tailwind CSS.

## Features

- Interactive 3D Rocket League-inspired golf environment
- Physics-based gameplay
- Responsive design with Tailwind CSS
- Intuitive controls for gameplay
- Dynamic course with obstacles

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/rocketleague-golf.git
cd rocketleague-golf
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. Navigate to the home page to see an overview of the game
2. Use the controls to interact with the game:
   - Arrow keys to control movement
   - Spacebar for actions
3. Aim for the goals and enjoy the Rocket League-inspired golf gameplay!

## Project Structure

```
/src
  /app               # Next.js app directory
    layout.tsx       # Root layout
    page.tsx         # Home page
  /components        # React components
  /lib               # Utility functions and helpers
/public
  /game.png         # Game screenshot
  /textures         # Texture images
```

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [React](https://reactjs.org/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Three.js](https://threejs.org/) - 3D rendering
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber) - React renderer for Three.js
- [React Three Drei](https://github.com/pmndrs/drei) - Useful helpers for React Three Fiber
- [React Three Cannon](https://github.com/pmndrs/use-cannon) - Physics for React Three Fiber

## Next Steps

Here are some ideas for expanding the project:

1. **Advanced Physics**: Enhance the physics system for more realistic gameplay.
2. **Multiple Arenas**: Implement different arenas with varying layouts and challenges.
3. **Power-ups**: Add Rocket League-style power-ups and boosts.
4. **Vehicle Customization**: Add options to customize the vehicle appearance and performance.
5. **Improved Graphics**: Add more detailed textures and models for the vehicles and arenas.
6. **Animations**: Add more visual feedback and effects.
7. **Multiplayer**: Implement real-time multiplayer capabilities.
8. **Game Persistence**: Save game state and high scores.
9. **Mobile Controls**: Optimize touch controls for mobile play.
10. **Sound Effects**: Add immersive sound effects for gameplay actions.

## License

MIT

## Acknowledgments

- Rocket League for the game inspiration
- Three.js community for resources and examples
- Tailwind CSS for the styling framework
- Next.js team for the amazing React framework
