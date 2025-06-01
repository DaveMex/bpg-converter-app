#include "bpg_wrapper.h"
#include <iostream>
#include <fstream>
#include <vector>

BPGWrapper::BPGWrapper() {
    // Initialize libbpg if needed (not usually necessary)
}

BPGWrapper::~BPGWrapper() {
    // Clean up libbpg if needed (not usually necessary)
}

bool BPGWrapper::decodeBPG(const std::string& filename, unsigned char** outputBuffer, int* width, int* height, int* channels) {
    std::ifstream file(filename, std::ios::binary | std::ios::ate);
    if (!file.is_open()) {
        std::cerr << "Error: Could not open file: " << filename << std::endl;
        return false;
    }

    std::streamsize size = file.tellg();
    file.seekg(0, std::ios::beg);

    std::vector<char> buffer(size);
    if (!file.read(buffer.data(), size)) {
        std::cerr << "Error: Could not read file: " << filename << std::endl;
        return false;
    }

    bpg_decoder_t* decoder = bpg_decoder_open();
    if (!decoder) {
        std::cerr << "Error: Could not open BPG decoder" << std::endl;
        return false;
    }

    if (bpg_decoder_decode(decoder, (uint8_t*)buffer.data(), size) < 0) {
        std::cerr << "Error: Could not decode BPG image" << std::endl;
        bpg_decoder_close(decoder);
        return false;
    }

    *width = bpg_decoder_get_width(decoder);
    *height = bpg_decoder_get_height(decoder);
    *channels = bpg_decoder_get_channels(decoder);

    int imageSize = (*width) * (*height) * (*channels);
    *outputBuffer = new unsigned char[imageSize];
    bpg_decoder_get_line(decoder, *outputBuffer);

    bpg_decoder_close(decoder);
    return true;
}

void BPGWrapper::freeBuffer(unsigned char* buffer) {
    delete[] buffer;
}
