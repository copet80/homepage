/**
 * A simple 2-dimensional vector class serving as data container that include vector operations.
 *
 * @author Anthony Tambrin
 */
export default class Vector2D {
  // ===========================================
  //  Constructor
  // ===========================================
  /**
   * @constructor
   * Creates an instance of this class.
   *
   * @param {number} x Starting X position.
   * @param {number} y Starting Y position.
   */
  constructor(x, y) {
    if (typeof x === 'undefined') x = 0;
    if (typeof y === 'undefined') y = 0;
    this.x = x;
    this.y = y;
  }

  // ===========================================
  //  Getters / Setters
  // ===========================================
  /**
   * Angle of this vector. Changing the angle changes the x and y but retains the same length.
   * @type {number}
   */
  get angle() {
    return Math.atan2(this.y, this.x);
  }
  /**
   * @private
   */
  set angle(value) {
    const len = this.length;
    this.x = Math.cos(value) * len;
    this.y = Math.sin(value) * len;
  }

  /**
   * Magnitude of this vector. Changing the length will change the x and y but not the angle of this vector.
   * @type {number}
   */
  get length() {
    return Math.sqrt(this.lengthSQ);
  }
  /**
   * @private
   */
  set length(value) {
    const a = Math.atan2(this.y, this.x);
    this.x = Math.cos(a) * value;
    this.y = Math.sin(a) * value;
  }

  /**
   * [read-only] Squared length of this vector.
   * @type {number}
   */
  get lengthSQ() {
    return this.x * this.x + this.y * this.y;
  }

  /**
   * [read-only] A vector that is perpendicular to this vector.
   * @type {number}
   */
  get perpendicular() {
    return new Vector2D(-this.y, this.x);
  }

  // ===========================================
  //  Public Methods
  // ===========================================
  /**
   * Adds a vector to this vector, creating a new Vector2D instance to hold the result.
   *
   * @param {Vector2D} v2 A Vector2D instance.
   * @return {Vector2D} A new vector containing the results of the addition.
   *
   * @see addRef
   */
  add(v2) {
    return new Vector2D(this.x + v2.x, this.y + v2.y);
  }

  /**
   * Adds a vector to this vector WITHOUT creating a new Vector2D.
   *
   * @param {Vector2D} v2 A Vector2D instance.
   */
  addRef(v2) {
    this.x += v2.x;
    this.y += v2.y;
  }

  /**
   * Generates a copy of this vector.
   *
   * @return {Vector2D} A copy of this vector.
   */
  clone() {
    return new Vector2D(this.x, this.y);
  }

  /**
   * Calculates the distance from this vector to another given vector.
   *
   * @param {Vector2D} v2 A Vector2D instance.
   * @return {number} The distance from this vector to the vector passed as a parameter.
   */
  dist(v2) {
    return Math.sqrt(this.distSQ(v2));
  }
  /**
   * Calculates the distance squared from this vector to another given vector.
   *
   * @param {Vector2D} v2 A Vector2D instance.
   * @return {number} The distance squared from this vector to the vector passed as a parameter.
   */
  distSQ(v2) {
    const dx = v2.x - this.x;
    const dy = v2.y - this.y;
    return dx * dx + dy * dy;
  }

  /**
   * Divides this vector by a scalar value, creating a new Vector2D instance to hold the result.
   *
   * @param {number} value A scalar value.
   * @return {Vector2D} A new vector containing the results of the division.
   */
  divide(value) {
    return new Vector2D(this.x / value, this.y / value);
  }

  /**
   * Divides this vector by a scalar value WITHOUT creating a new Vector2D.
   *
   * @param {Vector2D} value A Vector2D instance.
   */
  divideRef(value) {
    this.x /= value;
    this.y /= value;
  }

  /**
   * Calculates the dot product of this vector and another given vector.
   *
   * @param {Vector2D} v2 Another Vector2D instance.
   * @return {number} The dot product of this vector and the one.
   * passed in as a parameter.
   */
  dotProduct(v2) {
    return this.x * v2.x + this.y * v2.y;
  }

  /**
   * Indicates whether this vector and another Vector2D instance are equal in value.
   *
   * @param {Vector2D} v2 A Vector2D instance.
   * @return {boolean} True if the other vector is equal to this one, false if not.
   */
  equals(v2) {
    return this.x === v2.x && this.y === v2.y;
  }

  /**
   * Whether or not this vector is normalized, i.e. its length is equal to one.
   *
   * @return {boolean} True if length is one, otherwise false.
   */
  isNormalized() {
    return this.length === 1.0;
  }

  /**
   * Whether or not this vector is equal to zero, i.e. its x, y, and length are zero.
   *
   * @return {boolean} True if vector is zero, otherwise false.
   */
  isZero() {
    return this.x === 0 && this.y === 0;
  }

  /**
   * Multiplies this vector by a scalar value, creating a new Vector2D instance to hold the result.
   *
   * @param {number} value A scalar value.
   * @return {Vector2D} A new vector containing the results of the multiplication.
   */
  multiply(value) {
    return new Vector2D(this.x * value, this.y * value);
  }

  /**
   * Multiplies this vector by a scalar value WITHOUT creating a new Vector2D instance.
   *
   * @param {number} value A scalar value.
   */
  multiplyRef(value) {
    this.x *= value;
    this.y *= value;
  }

  /**
   * Normalizes this vector. Equivalent to setting the length to one, but more efficient.
   *
   * @return {Vector2D} A reference to this vector.
   */
  normalize() {
    const len = this.length;
    if (len === 0) {
      this.x = 1;
    } else {
      this.x /= len;
      this.y /= len;
    }
    return this;
  }

  /**
   * Reverses the direction of this vector.
   *
   * @return {Vector2D} A reference to this vector.
   */
  reverse() {
    this.x = -this.x;
    this.y = -this.y;
    return this;
  }

  /**
   * Determines if a given vector is to the right or left of this vector.
   *
   * @param {Vector2D} v2 Another Vector2D instance.
   * @return {int} If to the left, returns -1. If to the right, 1.
   */
  sign(v2) {
    return this.perpendicular.dotProduct(v2) < 0 ? -1 : 1;
  }

  /**
   * Subtracts a vector from this vector, creating a new Vector2D instance to hold the result.
   *
   * @param {Vector2D} v2 A Vector2D instance.
   * @return {Vector2D} A new vector containing the results of the subtraction.
   */
  subtract(v2) {
    return new Vector2D(this.x - v2.x, this.y - v2.y);
  }

  /**
   * Subtracts a vector from this vector WITHOUT creating a new Vector2D instance.
   *
   * @param {Vector2D} v2 A Vector2D instance.
   */
  subtractRef(v2) {
    this.x -= v2.x;
    this.y -= v2.y;
  }

  /**
   * Ensures the length of the vector is no longer than the given value.
   *
   * @param {number} max The maximum value this vector should be.
   * @return {Vector2D} A reference to this vector.
   */
  truncate(max) {
    this.length = Math.min(max, this.length);
    return this;
  }

  /**
   * Sets this vector's x and y values, and thus length, to zero.
   *
   * @return {Vector2D} A reference to this vector.
   */
  zero() {
    this.x = 0;
    this.y = 0;
    return this;
  }

  /**
   * Generates a string representation of this object.
   *
   * @return {string} A string representation of this object.
   */
  toString() {
    return '[Vector2D(x:' + this.x + ', y:' + this.y + ')]';
  }

  // =====================================================
  //  Public Class Methods
  // =====================================================
  /**
   * Calculates the angle between two vectors.
   *
   * @param {Vector2D} v1 The first Vector2D instance.
   * @param {Vector2D} v2 The second Vector2D instance.
   * @return {number} The angle between the two given vectors.
   */
  static angleBetween(v1, v2) {
    if (v1.isNormalized()) v1 = v1.clone().normalize();
    if (v2.isNormalized()) v2 = v2.clone().normalize();
    return Math.acos(v1.dotProduct(v2));
  }
}
