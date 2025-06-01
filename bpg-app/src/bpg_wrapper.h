#ifndef BPG_WRAPPER_H
#define BPG_WRAPPER_H

#include "libbpg/bpg.h"
#include <string>

class BPGWrapper {
public:
    BPGWrapper();
    ~BPGWrapper();

    // Decode a BPG image to a raw pixel buffer
    bool decodeBPG(const std::string& filename, unsigned char** outputBuffer, int* width, int* height, int* channels);

    // Free the allocated buffer
    void freeBuffer(unsigned char* buffer);
};

#endif // BPG_WRAPPER_H
