import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from '../entities/note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private noteRepository: Repository<Note>,
  ) {}

  async findAll(userId: number, folderId?: string): Promise<Note[]> {
    const where: any = { userId };

    if (folderId) {
      where.folderId = folderId;
    }

    return this.noteRepository.find({
      where,
      order: { updatedAt: 'DESC' },
    });
  }

  async findPending(userId: number): Promise<Note[]> {
    return this.noteRepository.find({
      where: { userId, syncStatus: 'pending' },
    });
  }

  async findOne(id: string, userId: number): Promise<Note> {
    const note = await this.noteRepository.findOne({
      where: { id, userId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return note;
  }

  async create(userId: number, createNoteDto: CreateNoteDto): Promise<Note> {
    const note = this.noteRepository.create({
      ...createNoteDto,
      userId,
      canvasBackground: createNoteDto.canvasBackground || 'grid',
      syncStatus: createNoteDto.syncStatus || 'pending',
    });

    return this.noteRepository.save(note);
  }

  async update(id: string, userId: number, updateNoteDto: UpdateNoteDto): Promise<Note> {
    const note = await this.findOne(id, userId);

    Object.assign(note, updateNoteDto);

    return this.noteRepository.save(note);
  }

  async remove(id: string, userId: number): Promise<void> {
    const note = await this.findOne(id, userId);
    await this.noteRepository.remove(note);
  }
}
