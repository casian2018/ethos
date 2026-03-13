import asyncio
import logging
import json
import os
from livekit.agents import JobContext, Worker, datachannel
from livekit.rtc import VideoFrame
import numpy as np
from ultralytics import YOLO

# Load the YOLO model
model = YOLO('yolov8n.pt')  # Using a standard small model

# Define the sports equipment classes that YOLO can detect
SPORTS_EQUIPMENT_CLASSES = [
    'sports ball', 'baseball bat', 'baseball glove', 'skateboard',
    'surfboard', 'tennis racket'
]

async def main(ctx: JobContext):
    """
    This is the main function for the AI agent.
    It is called when a new job is created.
    """
    logging.info("AI Agent for Object Detection starting...")
    room = ctx.room
    data_publisher = datachannel.DataPublisher(room)

    async def process_video_stream(video_stream):
        """
        Process the video stream, perform object detection, and send results.
        """
        async for frame_event in video_stream:
            frame = frame_event.frame
            # Convert the video frame to a NumPy array for YOLO processing
            buffer = frame.buffer
            if not isinstance(buffer, np.ndarray):
                # This might be a bit slow, but it's a reliable way to get a NumPy array
                # from different buffer types.
                buffer = VideoFrame.to_ndarray(frame)

            # Perform object detection
            results = model(buffer, stream=False)

            detections = []
            for r in results:
                for box in r.boxes:
                    class_id = int(box.cls[0])
                    class_name = model.names[class_id]

                    if class_name in SPORTS_EQUIPMENT_CLASSES:
                        # Calculate proximity based on bounding box height
                        box_height = box.xywh[0][3].item()
                        frame_height = frame.height
                        proximity_ratio = box_height / frame_height

                        if proximity_ratio > 0.5:
                            distance = "Too close"
                        else:
                            distance = "Safe zone"

                        detections.append({
                            "object": class_name,
                            "distance": distance,
                            "box": box.xywh[0].tolist()
                        })

            # If any sports equipment is detected, send the data
            if detections:
                await data_publisher.publish(json.dumps(detections))


    @room.on("participant_connected")
    async def on_participant_connected(participant):
        """
        Event handler for when a participant connects to the room.
        """
        logging.info(f"Participant connected: {participant.identity}")
        try:
            video_track_pub = await asyncio.wait_for(
                participant.tracks.wait_for_track("video"), timeout=10.0
            )
            if video_track_pub and video_track_pub.track:
                video_stream = video_track_pub.track
                asyncio.create_task(process_video_stream(video_stream))
        except asyncio.TimeoutError:
            logging.warning(f"No video track from {participant.identity} after 10s.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    async def job_request_cb(job_request: JobContext):
        """
        Callback function for when a new job request is received.
        """
        logging.info("Accepting job for object detection: %s", job_request)
        await job_request.accept(main)

    # Create and run the worker
    worker = Worker(
        request_callback=job_request_cb,
        worker_type="ai-agent-yolo", # Different worker type to avoid conflicts
        livekit_url=os.environ.get("LIVEKIT_URL", "ws://localhost:7880"),
        api_key=os.environ.get("LIVEKIT_API_KEY", "devkey"),
        api_secret=os.environ.get("LIVEKIT_API_SECRET", "secret"),
    )
    asyncio.run(worker.run())
