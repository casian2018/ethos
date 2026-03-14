import asyncio
import logging
import os
import time
from livekit.agents import JobContext, Worker
from livekit.agents.llm import LLM
from livekit.plugins import gemini

async def main(ctx: JobContext):
    llm = gemini.LLM(model="gemini-1.5-flash")

    @ctx.room.on("participant_connected")
    def _on_participant_connected(participant):
        logging.info(f"Participant connected: {participant.identity}")
        # Start a new task for each participant to handle their tracks
        asyncio.create_task(handle_participant(participant, llm))

async def handle_participant(participant, llm: LLM):
    # Find the video track of the participant
    video_track = None
    for track_pub in participant.tracks.values():
        if track_pub.kind == "video":
            # Wait for the track to be subscribed
            await track_pub.set_subscribed(True)
            video_track = track_pub.track
            break

    if not video_track:
        logging.warning(f"No video track found for participant {participant.identity}")
        return

    # Create a stream for the LLM
    chat = llm.chat()

    # Create an audio stream for the response
    audio_stream = await participant.room.local_participant.publish_audio_source("ai-voice", "audio/opus")

    async def llm_stream_processor():
        # Process video frames periodically to avoid API rate limits (Constant Scanning)
        last_process_time = 0
        process_interval = 2.0  # Analyze a frame every 2 seconds
        
        async for frame in video_track:
            current_time = time.time()
            if current_time - last_process_time >= process_interval:
                last_process_time = current_time
                try:
                    result = await chat.say(frame)
                    if result:
                        await audio_stream.publish_frame(result)
                except Exception as e:
                    logging.error(f"Error processing frame: {e}")

    # Run the processor
    await llm_stream_processor()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    async def job_request_cb(job_request):
        logging.info("Accepting job: %s", job_request)
        await job_request.accept(main)

    worker = Worker(
        request_callback=job_request_cb,
        worker_type="ai-agent",
        livekit_url=os.environ.get("LIVEKIT_URL"),
        api_key=os.environ.get("LIVEKIT_API_KEY"),
        api_secret=os.environ.get("LIVEKIT_API_SECRET"),
    )
    asyncio.run(worker.run())
