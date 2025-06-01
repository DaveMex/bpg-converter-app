cmake_minimum_required(VERSION 3.16) # Qt 6 requires at least CMake 3.16
project(BPGApp)

# Find Qt6
find_package(Qt6 COMPONENTS Core Widgets REQUIRED)

# Add libbpg as a subdirectory
add_subdirectory(libbpg)

# Include directories
include_directories(src)
include_directories(libbpg)

# Add executable
add_executable(bpg-app src/main.cpp src/bpg_wrapper.cpp src/encoder_wrapper.cpp src/gui/mainwindow.cpp)

# Link libraries
target_link_libraries(bpg-app Qt6::Core Qt6::Widgets bpg)

# Install target
install(TARGETS bpg-app DESTINATION bin)

# Copy resources
file(GLOB resources "resources/*")
install(FILES ${resources} DESTINATION resources)
