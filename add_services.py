import os
import sys
import django

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()
from services.models import Service, ServiceCategory

service_data = {
    "Cleaning": [
        "Home Cleaning", "Sofa Cleaning", "Carpet Cleaning",
        "Window Cleaning", "Toilet Cleaning", "Move-in Cleaning",
        "Move-out Cleaning"
    ],
    "Electrical Repair": [
        "Fan Repair", "Light Installation", "Switch Repair",
        "Socket Repair", "Inverter Repair", "Water Heater Repair",
        "Electrical Installation"
    ],
    "Home Repair": [
        "Plumbing Repair", "Tap Repair", "Pipe Repair",
        "Water Leakage Repair", "Door Repair", "Window Repair",
        "Furniture Repair", "Wall Painting", "Tile Repair",
        "Roof Repair"
    ],
    "Vehicle Service": [
        "Car Repair", "Bike Repair", "Motorcycle Repair",
        "Bike Servicing", "Vehicle Servicing", "Battery Replacement",
        "Tyre Repair", "Puncture Repair", "Oil Change", "Engine Repair"
    ]
}

added = 0

for category_name, names in service_data.items():
    category = ServiceCategory.objects.get(name=category_name)

    for name in names:
        obj, created = Service.objects.get_or_create(
            category=category,
            name=name,
            defaults={
                "description": f"{name} service",
                "base_price": 1000,
                "estimated_duration": 60,
                "is_active": True
            }
        )

        if created:
            added += 1

print("New services added:", added)
print("Total services:", Service.objects.count())
