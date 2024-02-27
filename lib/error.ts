export class CustomError extends Error {
  title

  constructor(message: string, title: string = '👷 Heads up') {
    super(message)
    this.name = this.constructor.name
    this.title = title
  }
}
