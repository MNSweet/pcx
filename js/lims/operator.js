export class Operator {
  getUrlParams() {
    return new URLSearchParams(window.location.search);
  }
  
  getExtraParams() {
    return Object.fromEntries(this.getUrlParams().entries());
  }
}