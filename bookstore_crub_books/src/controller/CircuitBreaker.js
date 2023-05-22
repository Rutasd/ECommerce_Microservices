class CircuitBreaker {
    constructor(timeout, retryInterval) {
      this.timeout = timeout;
      this.retryInterval = retryInterval;
      this.state = 'CLOSED';
      this.firstCall = true;
      this.lastOpened = null;
    }
  
    isOpen() {
      if (this.state === 'OPEN') {
        const currentTime = new Date().getTime();
        if (currentTime - this.lastOpened > this.retryInterval) {
          return false;
        }
      }
      return this.state === 'OPEN';
    }

    updateFirstCall(val) {
        this.firstCall = val;
    }
  
    onTimeout() {
      this.state = 'OPEN';
      this.lastOpened = new Date().getTime();
    }
  
    onSuccess() {
      this.state = 'CLOSED';
    }
  }
  
  module.exports = CircuitBreaker;