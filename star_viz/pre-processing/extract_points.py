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
    
    if len(stats) <= 1:  # Only background
        # If no components found, return center of image
        return np.array([[img.shape[0]/2, img.shape[1]/2]]), np.array([0])
    
    # Find the largest component
    areas = stats[1:, cv2.CC_STAT_AREA]  # Skip background
    largest_comp_idx = np.argmax(areas) + 1  # Add 1 because we skipped background
    
    # Get centroid of largest component
    black_hole_point = centroids[largest_comp_idx].reshape(1, 2)
    
    # Get the maximum intensity in the component
    black_hole_intensity = np.array([np.max(img[labels == largest_comp_idx])])
    
    return black_hole_point, black_hole_intensity

def detect_stars(img, min_distance=10, threshold_rel=0.2):
    """
    Detect stars in an image using peak local max detection.
    
    Args:
        img: Input image (2D numpy array)
        min_distance: Minimum distance between peaks
        threshold_rel: Minimum intensity threshold relative to image max
    
    Returns:
        coordinates: Array of (x,y) coordinates for detected stars
        intensities: Array of intensity values for detected stars
        sizes: Array of star sizes based on their brightness
        colors: Array of star colors (temperature-based)
    """
    from skimage.feature import peak_local_max
    
    # Normalize image to 0-1 range
    img_normalized = img.astype(float)
    img_normalized = (img_normalized - img_normalized.min()) / (img_normalized.max() - img_normalized.min())
    
    # Apply Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(img_normalized, (5, 5), 0)
    
    # Find local maxima
    coordinates = peak_local_max(
        blurred,
        min_distance=min_distance,
        threshold_rel=threshold_rel,
        exclude_border=False
    )
    
    # Get intensities at peak locations
    intensities = np.array([img[y, x] for y, x in coordinates])
    
    # Calculate star sizes based on intensity (brighter = bigger)
    sizes = 1 + (intensities / 255) * 4  # Size range: 1-5 pixels
    
    # Calculate star colors based on intensity (simulating temperature)
    # Brighter stars are typically bluer/whiter, dimmer stars are more red/orange
    colors = []
    for intensity in intensities:
        if intensity > 200:  # Very bright stars (white/blue)
            colors.append('#FFFFFF')
        elif intensity > 150:  # Bright stars (light blue)
            colors.append('#A0D8EF')
        elif intensity > 100:  # Medium stars (yellow)
            colors.append('#FFE87C')
        else:  # Dim stars (orange/red)
            colors.append('#FF9966')
    
    colors = np.array(colors)
    
    # Convert coordinates to (x,y) format
    coordinates = coordinates[:, [1, 0]]  # Swap columns to get (x,y)
    
    return coordinates, intensities, sizes, colors

def detect_clouds(img, star_points, n_points=100000, min_brightness=30, max_brightness=150):
    """
    Detect uniform clouds of particles between stars.
    
    Args:
        img: Input image (2D numpy array)
        star_points: Array of (x,y) coordinates of detected stars to avoid
        n_points: Number of cloud particles to sample
        min_brightness: Minimum brightness threshold for cloud particles
        max_brightness: Maximum brightness threshold for cloud particles
    
    Returns:
        coordinates: Array of (x,y) coordinates for cloud particles
        intensities: Array of intensity values for cloud particles
        sizes: Array of particle sizes
        colors: Array of particle colors
    """
    # Create a mask to exclude areas around stars
    star_mask = np.zeros_like(img, dtype=bool)
    for x, y in star_points:
        # Create a circular mask around each star
        y, x = int(y), int(x)  # Convert to integers for indexing
        y_indices, x_indices = np.ogrid[-10:11, -10:11]
        mask = x_indices**2 + y_indices**2 <= 10**2
        
        # Ensure we don't go out of bounds
        y_start, y_end = max(0, y-10), min(img.shape[0], y+11)
        x_start, x_end = max(0, x-10), min(img.shape[1], x+11)
        mask_y_start = 10 - (y - y_start)
        mask_y_end = 10 + (y_end - y)
        mask_x_start = 10 - (x - x_start)
        mask_x_end = 10 + (x_end - x)
        
        star_mask[y_start:y_end, x_start:x_end] |= mask[mask_y_start:mask_y_end, mask_x_start:mask_x_end]
    
    # Create probability map for cloud particles
    cloud_mask = (img >= min_brightness) & (img <= max_brightness) & ~star_mask
    prob_map = np.zeros_like(img, dtype=float)
    prob_map[cloud_mask] = img[cloud_mask]
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
    
    # Calculate sizes (smaller than stars)
    sizes = 0.5 + (intensities / 255) * 1.5  # Size range: 0.5-2 pixels
    
    # Calculate colors (blue/purple hues for nebula effect)
    # Brighter stars are typically bluer/whiter, dimmer stars are more red/orange
    colors = []
    for intensity in intensities:
        alpha = int((intensity - min_brightness) / (max_brightness - min_brightness) * 255)
        if intensity > 100:
            colors.append('#B39DDB')  # Light purple
        elif intensity > 70:
            colors.append('#9575CD')  # Medium purple
        else:
            colors.append('#7E57C2')  # Dark purple
    
    coordinates = np.column_stack((x_coords, y_coords))
    return coordinates, intensities, sizes, np.array(colors)

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

def export_to_csv(star_points, star_masses, star_sizes, star_colors, 
                 cloud_points, cloud_masses, cloud_sizes, cloud_colors,
                 black_hole_point, black_hole_mass, output_path):
    # Convert numerical data to float type explicitly
    star_points = star_points.astype(float)
    star_masses = star_masses.astype(float)
    star_sizes = star_sizes.astype(float)
    cloud_points = cloud_points.astype(float)
    cloud_masses = cloud_masses.astype(float)
    cloud_sizes = cloud_sizes.astype(float)
    black_hole_point = black_hole_point.astype(float)
    black_hole_mass = black_hole_mass.astype(float)
    
    # Prepare data for each point type with their masses and type label
    stars_data = np.column_stack((
        star_points, 
        star_masses, 
        star_sizes,
        star_colors,
        np.full(len(star_points), 'star', dtype=object)
    ))
    
    clouds_data = np.column_stack((
        cloud_points,
        cloud_masses,
        cloud_sizes,
        cloud_colors,
        np.full(len(cloud_points), 'cloud', dtype=object)
    ))
    
    black_hole_data = np.column_stack((
        black_hole_point, 
        black_hole_mass, 
        [8.0],  # Fixed size for black hole
        ['#FF0000'],  # Fixed color for black hole
        ['center']
    ))
    
    # Combine all data
    all_points = np.vstack((stars_data, clouds_data, black_hole_data))
    
    # Save to CSV using pandas for better handling of mixed data types
    import pandas as pd
    df = pd.DataFrame(all_points, columns=['y', 'x', 'intensity', 'size', 'color', 'type'])
    df.to_csv(output_path, index=False)

if __name__ == "__main__":
    # Load and process image
    image_path = "NGC5468.png"
    img = load_and_preprocess_image(image_path)
    
    # Detect black hole
    black_hole_point, black_hole_mass = detect_black_hole(img)
    
    # Detect stars
    star_points, star_masses, star_sizes, star_colors = detect_stars(img)
    print(f"Detected {len(star_points)} stars")
    
    # Detect clouds
    cloud_points, cloud_masses, cloud_sizes, cloud_colors = detect_clouds(img, star_points)
    print(f"Generated {len(cloud_points)} cloud particles")
    
    # Export all points to CSV
    export_to_csv(
        star_points, 
        star_masses, 
        star_sizes,
        star_colors,
        cloud_points,
        cloud_masses,
        cloud_sizes,
        cloud_colors,
        black_hole_point, 
        black_hole_mass, 
        "galaxy_points.csv"
    )