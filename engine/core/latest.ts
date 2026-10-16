/** Token for asynchronous work: an old result must never replace a newer request. */
export class LatestRequest {
  private value = 0;
  next() { return ++this.value; }
  accepts(id: number) { return id === this.value; }
}
