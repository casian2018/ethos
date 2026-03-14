import asyncio
import logging
import json
import os
from livekit import rtc
from livekit.agents import AutoSubscribe, JobContext, JobProcess, WorkerOptions, llm, multimodal
from livekit.plugins import google

# Load YOLO model (will be loaded on first use)
model = None

def load_model():
    global model
    if model is None:
        from ultralytics import YOLO
        model = YOLO('yolov8n.pt')
    return model

# Define the sports equipment classes that YOLO can detect
SPORTS_EQUIPMENT_CLASSES = [
    'sports ball', 'baseball bat', 'baseball glove', 'skateboard',
    'surfboard', 'tennis racket'
]

async def entry_point(ctx: JobContext):
    """
    This is the entry point for the AI agent.
    It is called when a new job is created.
    """
    logging.info("AI Agent for Object Detection starting...")
    
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_AND_VIDEO)

    # Initialize Gemini multimodal agent
    agent = multimodal.MultimodalAgent(
        model=google.Multimodal(model="gemini-2.0-flash"),
        ctx=ctx
    )
    
    # Start the agent
    agent.start()

    @ctx.room.on("participant_connected")
    async def on_participant_connected(participant: rtc.Participant):
        logging.info(f"Participant connected: {participant.identity}")
        
        # Process video tracks
        for track_publication in participant.track_publications.values():
            if track_publication.track_kind == rtc.TrackKind.VIDEO:
                video_track = track_publication.track
                if video_track:
                    asyncio.create_task(process_video_stream(ctx, video_track))

    @ctx.room.on("track_subscribed")
    async def on_track_subscribed(
        participant: rtc.Participant,
        track: rtc.Track,
        publication: rtc.TrackPublication
    ):
        if isinstance(track, rtc.VideoTrack):
            asyncio.create_task(process_video_stream(ctx, track))


async def process_video_stream(ctx: JobContext, video_track: rtc.VideoTrack):
    """
    Process the video stream, perform object detection, and send results.
    """
    try:
        model = load_model()
        
        async for frame_event in video_track:
            frame = frame_event.frame
            
            # Convert the video frame to a NumPy array for YOLO processing
            buffer = frame.buffer
            import numpy as np
            if not isinstance(buffer, np.ndarray):
                buffer = rtc.VideoFrame.to_ndarray(frame)

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

            # If any sports equipment is detected, log the data
            if detections:
                logging.info(f"Detections: {json.dumps(detections)}")
                
    except Exception as e:
        logging.error(f"Error processing video stream: {e}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    # Create and run the worker with new API
    worker_options = WorkerOptions(
        entry_point_fnc=entry_point,
    )
    
    import livekit
    livekit.run(worker_options)
