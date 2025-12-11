import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Folder } from '../entities/folder.entity';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(Folder)
    private folderRepository: Repository<Folder>,
  ) {}

  async findAll(userId: number): Promise<Folder[]> {
    return this.folderRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: number): Promise<Folder> {
    const folder = await this.folderRepository.findOne({
      where: { id, userId },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return folder;
  }

  async create(userId: number, createFolderDto: CreateFolderDto): Promise<Folder> {
    const folder = this.folderRepository.create({
      ...createFolderDto,
      userId,
    });

    return this.folderRepository.save(folder);
  }

  async update(id: string, userId: number, updateFolderDto: UpdateFolderDto): Promise<Folder> {
    const folder = await this.findOne(id, userId);

    folder.name = updateFolderDto.name;

    return this.folderRepository.save(folder);
  }

  async remove(id: string, userId: number): Promise<void> {
    const folder = await this.findOne(id, userId);
    await this.folderRepository.remove(folder);
  }
}
