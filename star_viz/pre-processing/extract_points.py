import cv2
import numpy as np
from sklearn.cluster import DBSCAN
import matplotlib.pyplot as plt

def load_and_preprocess_image(image_path):
    # Read image in grayscale
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError("Could not load image")
    
    # Normalize image
    img_normalized = cv2.normalize(img, None, 0, 255, cv2.NORM_MINMAX)
    return img_normalized

def detect_black_hole(img, threshold=240):
    # Create binary mask of bright regions
    bright_mask = img >= threshold
    
    # Find connected components
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(bright_mask.astype(np.uint8))
    
    # Skip label 0 as it's the background
    areas = stats[1:, cv2.CC_STAT_AREA]
    centroids = centroids[1:]
    
    # Find the component closest to the image center
    center = np.array([img.shape[0]/2, img.shape[1]/2])
    distances = np.linalg.norm(centroids - center, axis=1)
    
    # Among the largest components (top 25% by area), choose the one closest to center
    size_threshold = np.percentile(areas, 75)
    large_components = areas >= size_threshold
    if np.any(large_components):
        closest_large = np.argmin(distances * ~large_components)
        black_hole_point = centroids[closest_large].reshape(1, 2)
        black_hole_intensity = np.array([np.max(img[labels == closest_large + 1])])
    else:
        # Fallback to just taking the closest component
        closest = np.argmin(distances)
        black_hole_point = centroids[closest].reshape(1, 2)
        black_hole_intensity = np.array([np.max(img[labels == closest + 1])])
    
    return black_hole_point, black_hole_intensity

def detect_bright_stars(img, threshold=240):
    # Detect very bright points (stars)
    star_mask = img > threshold
    star_points = np.column_stack(np.where(star_mask))
    star_intensities = img[star_mask]
    return star_points, star_intensities

def sample_galaxy_points(img, n_points=1000, min_brightness=100):
    # Create probability distribution based on brightness
    prob_map = np.clip(img - min_brightness, 0, 255)
    prob_map = prob_map / prob_map.sum()
    
    # Flatten probability map
    flat_prob = prob_map.ravel()
    
    # Generate random indices based on probability distribution
    indices = np.random.choice(
        len(flat_prob),
        size=n_points,
        p=flat_prob
    )
    
    # Convert flat indices back to 2D coordinates
    y_coords = indices // img.shape[1]
    x_coords = indices % img.shape[1]
    
    # Get intensities for sampled points
    intensities = img[y_coords, x_coords]
    
    return np.column_stack((y_coords, x_coords)), intensities

def export_to_csv(star_points, star_masses, cloud_points, cloud_masses, black_hole_point, black_hole_mass, output_path):
    # Convert numerical data to float type explicitly
    star_points = star_points.astype(float)
    star_masses = star_masses.astype(float)
    cloud_points = cloud_points.astype(float)
    cloud_masses = cloud_masses.astype(float)
    black_hole_point = black_hole_point.astype(float)
    black_hole_mass = black_hole_mass.astype(float)
    
    # Prepare data for each point type with their masses and type label
    stars_data = np.column_stack((star_points, star_masses, np.full(len(star_points), 'star', dtype=object)))
    cloud_data = np.column_stack((cloud_points, cloud_masses, np.full(len(cloud_points), 'cloud', dtype=object)))
    black_hole_data = np.column_stack((black_hole_point, black_hole_mass, ['black_hole']))
    
    # Combine all data
    all_points = np.vstack((stars_data, cloud_data, black_hole_data))
    
    # Save to CSV using pandas for better handling of mixed data types
    import pandas as pd
    df = pd.DataFrame(all_points, columns=['y', 'x', 'intensity', 'type'])
    df.to_csv(output_path, index=False)

# Replace the main execution block
if __name__ == "__main__":
    # Load and process image
    image_path = "NGC5468.png"  # Replace with your image path
    output_path = "galaxy_points.csv"  # CSV output path
    img = load_and_preprocess_image(image_path)

    # Detect black hole
    black_hole_point, black_hole_mass = detect_black_hole(img)
    
    # Detect bright stars
    star_points, star_masses = detect_bright_stars(img, threshold=240)

    # Sample points from galaxy arms
    cloud_points, cloud_masses = sample_galaxy_points(img, n_points=5000, min_brightness=100)
    
    print("Star points:  ", len(star_points))
    print("Cloud points: ", len(cloud_points))

    # Export to CSV
    export_to_csv(  star_points, star_masses, cloud_points, cloud_masses, 
                    black_hole_point, black_hole_mass, output_path)