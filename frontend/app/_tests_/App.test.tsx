import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Dummy component
function Dummy() {
  return <div>Hello, LiquidFlow!</div>
}

// Vitest test
test('renders dummy component', () => {
  render(<Dummy />)
  expect(screen.getByText('Hello, LiquidFlow!'))
})