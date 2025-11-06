import DiffMatchPatch from 'diff-match-patch';

const dmp = new DiffMatchPatch();

/**
 * Operational Transformation utilities for real-time collaboration
 * Handles conflict resolution when multiple users edit simultaneously
 */

export class OperationalTransform {
  /**
   * Create a patch representing changes between two texts
   */
  static createPatch(originalText, modifiedText) {
    const patches = dmp.patch_make(originalText, modifiedText);
    return dmp.patch_toText(patches);
  }

  /**
   * Apply a patch to text
   */
  static applyPatch(text, patchText) {
    const patches = dmp.patch_fromText(patchText);
    const [result] = dmp.patch_apply(patches, text);
    return result;
  }

  /**
   * Transform two concurrent operations to resolve conflicts
   */
  static transform(operation1, operation2, baseText) {
    // For simple text operations, we'll use a timestamp-based approach
    // More complex OT would require understanding the operation types
    return {
      transformedOp: operation1,
      shouldApply: operation1.timestamp > operation2.timestamp
    };
  }

  /**
   * Check if two operations conflict
   */
  static hasConflict(op1, op2) {
    // Simple conflict detection based on overlapping ranges
    // In a real implementation, this would be more sophisticated
    return (
      op1.type === 'text-change' &&
      op2.type === 'text-change' &&
      op1.timestamp &&
      op2.timestamp &&
      Math.abs(op1.timestamp - op2.timestamp) < 1000 // Within 1 second
    );
  }
}

/**
 * Simple version-based conflict resolution
 */
export class VersionManager {
  static resolveConflict(clientVersion, serverVersion, clientText, serverText) {
    if (clientVersion > serverVersion) {
      return { text: clientText, version: clientVersion };
    } else if (serverVersion > clientVersion) {
      return { text: serverText, version: serverVersion };
    } else {
      // Same version, use timestamp or merge strategies
      return { text: serverText, version: serverVersion + 1 };
    }
  }
}

export default OperationalTransform;