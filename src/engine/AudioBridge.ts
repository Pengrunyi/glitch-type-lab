/** Lazy Web Audio entry point for future audio-reactive modulation. Never requests microphone access on startup. */
export class AudioBridge {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  async connect(stream: MediaStream) {
    this.context ??= new AudioContext();
    await this.context.resume();
    this.analyser = this.context.createAnalyser();
    this.context.createMediaStreamSource(stream).connect(this.analyser);
    return this.analyser;
  }
  async dispose() {
    await this.context?.close();
    this.context = null;
    this.analyser = null;
  }
}
