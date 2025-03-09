# 3D Golf Game

A browser-based 3D golf game built with Next.js, React, Three.js (via React Three Fiber), and Tailwind CSS.

## Features

- Interactive 3D golf environment
- Realistic ball physics using @react-three/cannon
- Responsive design with Tailwind CSS
- Power and angle controls for golf swings
- Multi-player scoreboard
- Dynamic course with obstacles and terrain

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/golf-generator.git
cd golf-generator
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
2. Click "Play Now" or navigate to `/game` to start playing
3. Adjust the power and angle using the sliders or keyboard controls:
   - Arrow keys (←/→) to adjust angle
   - Arrow keys (↑/↓) to adjust power
   - Spacebar to swing
4. Aim for the hole and try to get the lowest score possible!

## Project Structure

```
/src
  /app               # Next.js app directory
    /game            # Game page
    layout.tsx       # Root layout
    page.tsx         # Home page
  /components
    /layout          # Layout components (Header, Footer)
    /game            # Game components
      GolfGame.tsx   # Main game component
      GolfBall.tsx   # Golf ball with physics
      GolfCourse.tsx # Course terrain
      ControlPanel.tsx # UI controls
      Scoreboard.tsx   # Player scores
/public
  /textures          # Texture images
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

1. **Advanced Terrain**: Add more complex terrain with hills, sand traps, and water hazards.
2. **Multiple Courses**: Implement different golf courses with varying difficulty.
3. **Club Selection**: Add different club types that affect distance and trajectory.
4. **Wind Effects**: Implement wind that affects ball physics.
5. **Improved Graphics**: Add more detailed textures and models for the course and ball.
6. **Animations**: Add player character model with swing animations.
7. **Multiplayer**: Implement real-time multiplayer using WebSockets or similar technology.
8. **Game Persistence**: Save game state to localStorage or a database.
9. **Mobile Controls**: Optimize touch controls for mobile play.
10. **Sound Effects**: Add sound effects for swinging, ball impacts, etc.

## License

MIT

## Acknowledgments

- Three.js community for resources and examples
- Tailwind CSS for the styling framework
- Next.js team for the amazing React framework
